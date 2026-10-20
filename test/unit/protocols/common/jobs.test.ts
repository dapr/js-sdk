/*
Copyright 2026 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { create, fromJson } from "@bufbuild/protobuf";
import { AnySchema, anyPack, StructSchema, ValueSchema } from "@bufbuild/protobuf/wkt";
import { CronExpressionBuilder, CronPeriod, JobOptions } from "../../../../src";
import { encodeJob, decodeJob, decodeJobData, validateJobName } from "../../../../src/jobs/Jobs.util";
import RuntimeVersionChecker from "../../../../src/implementation/Client/RuntimeVersionChecker";
import IClientMetadata from "../../../../src/interfaces/Client/IClientMetadata";
import { GetMetadataResponse } from "../../../../src/types/metadata/GetMetadataResponse";
import { JobSchema } from "../../../../src/proto/dapr/proto/runtime/v1/jobs_pb";

const metadataResponse = (runtimeVersion?: string): GetMetadataResponse => ({
  id: "test",
  runtimeVersion,
  actors: [],
  components: [],
  extended: {},
});
const metadataClient = (version?: string) =>
  ({
    get: jest.fn(async () => metadataResponse(version)),
    set: jest.fn(async () => true),
  } satisfies IClientMetadata);

describe("Jobs runtime reflection", () => {
  it.each([
    ["1.16.0", "v1.0-alpha1"],
    ["v1.16.9", "v1.0-alpha1"],
    ["1.17.9", "v1.0-alpha1"],
    ["1.18.0", "v1.0"],
    ["1.18.1+build.2", "v1.0"],
    ["1.18.0-rc.1", "v1.0-alpha1"],
    ["1.19.0-rc.1", "v1.0"],
    ["2.0.0", "v1.0"],
    [" EDGE ", "v1.0"],
  ])("selects %s -> %s", async (version, expected) => {
    await expect(new RuntimeVersionChecker(metadataClient(version)).getJobsApiVersion()).resolves.toBe(expected);
  });

  it.each([undefined, "", "latest", "unknown", "1", "1.18.bad", "1.15.9", "0.18.0"])(
    "rejects unsupported/unknown version %s and retries metadata",
    async (version) => {
      const metadata = metadataClient(version);
      const checker = new RuntimeVersionChecker(metadata);
      await expect(checker.getJobsApiVersion()).rejects.toThrow();
      metadata.get.mockResolvedValue(metadataResponse("1.18.0"));
      await expect(checker.getJobsApiVersion()).resolves.toBe("v1.0");
      expect(metadata.get).toHaveBeenCalledTimes(2);
    },
  );

  it("shares in-flight lookups, isolates sidecars, and leaves metadata.get fresh", async () => {
    const metadata = metadataClient("1.18.0");
    const checker = new RuntimeVersionChecker(metadata);
    let resolve!: (value: GetMetadataResponse) => void;
    metadata.get.mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const first = checker.getJobsApiVersion();
    expect(checker.getJobsApiVersion()).toBe(first);
    resolve(metadataResponse("1.16.0"));
    await expect(first).resolves.toBe("v1.0-alpha1");
    await expect(checker.getJobsApiVersion()).resolves.toBe("v1.0-alpha1");
    await expect(new RuntimeVersionChecker(metadataClient("1.18.0")).getJobsApiVersion()).resolves.toBe("v1.0");
    expect(metadata.get).toHaveBeenCalledTimes(1);
    await expect(metadata.get()).resolves.toEqual(metadataResponse("1.18.0"));
  });

  it("propagates metadata failures to all callers without poisoning the cache", async () => {
    const metadata = metadataClient("1.16.0");
    const checker = new RuntimeVersionChecker(metadata);
    const error = new Error("metadata unavailable");
    metadata.get.mockRejectedValueOnce(error);
    expect(await Promise.allSettled([checker.getJobsApiVersion(), checker.getJobsApiVersion()])).toEqual([
      { status: "rejected", reason: error },
      { status: "rejected", reason: error },
    ]);
    await expect(checker.getJobsApiVersion()).resolves.toBe("v1.0-alpha1");
  });

  it.each([
    ["  V1.18  ", "v1.0", "v1.0"],
    ["1.18.0-rc.1+build.2", "v1.0", "v1.0-alpha1"],
    ["2.0.0-rc.1", "v1.0", "v1.0"],
    ["0.99.0", "v1.0-alpha1", undefined],
  ])("resolves independent API boundaries for %s", async (version, bulkVersion, jobsVersion) => {
    const checker = new RuntimeVersionChecker(metadataClient(version));
    await expect(checker.getBulkPublishApiVersion()).resolves.toBe(bulkVersion);
    if (jobsVersion === undefined) {
      await expect(checker.getJobsApiVersion()).rejects.toThrow("Jobs requires Dapr runtime 1.16 or later");
    } else {
      await expect(checker.getJobsApiVersion()).resolves.toBe(jobsVersion);
    }
  });

  it("retries failed bulk metadata without discarding a cached Jobs decision", async () => {
    const metadata = metadataClient("1.18.0");
    const checker = new RuntimeVersionChecker(metadata);
    const jobs = checker.getJobsApiVersion();
    await expect(jobs).resolves.toBe("v1.0");
    const error = new Error("metadata unavailable");
    metadata.get.mockRejectedValueOnce(error);
    await expect(checker.getBulkPublishApiVersion()).rejects.toBe(error);
    expect(checker.getJobsApiVersion()).toBe(jobs);
    metadata.get.mockResolvedValue(metadataResponse("1.16.0"));
    await expect(checker.getBulkPublishApiVersion()).resolves.toBe("v1.0-alpha1");
    expect(checker.getJobsApiVersion()).toBe(jobs);
    expect(metadata.get).toHaveBeenCalledTimes(3);
  });
});

describe("CronExpressionBuilder", () => {
  it("builds six fields in order, sorts and deduplicates lists, and replaces fields", () => {
    const builder = new CronExpressionBuilder();
    expect(builder.toString()).toBe("* * * * * *");
    expect(
      builder
        .on("second", 0)
        .every("minute", 15)
        .on("hour", 18, 8, 8)
        .through("dayOfMonth", 1, 10)
        .on("month", 12, 1)
        .through("dayOfWeek", 1, 5)
        .toString(),
    ).toBe("0 */15 8,18 1-10 1,12 1-5");
    expect(builder.each("hour").toString()).toBe("0 */15 * 1-10 1,12 1-5");
    expect(builder.withTimeZone("America/New_York").toString()).toBe("CRON_TZ=America/New_York 0 */15 * 1-10 1,12 1-5");
  });

  it.each([
    ["second", 0, 59],
    ["minute", 0, 59],
    ["hour", 0, 23],
    ["dayOfMonth", 1, 31],
    ["month", 1, 12],
    ["dayOfWeek", 0, 6],
  ] as const)("enforces %s boundaries and does not mutate after invalid input", (period, min, max) => {
    const builder = new CronExpressionBuilder().on(period, min, max);
    const expression = builder.toString();
    for (const value of [min - 1, max + 1, NaN, Infinity, 1.5]) {
      expect(() => builder.on(period, value)).toThrow(RangeError);
      expect(() => builder.through(period, min, value)).toThrow(RangeError);
    }
    expect(() => builder.on(period)).toThrow();
    expect(() => builder.through(period, max, min)).toThrow();
    expect(() => builder.through(period, min, min)).toThrow();
    for (const interval of [0, -1, NaN, Infinity, 1.5, max - min + 2]) {
      expect(() => builder.every(period, interval)).toThrow();
    }
    expect(builder.toString()).toBe(expression);
    expect(() => builder.every(period, max - min + 1)).not.toThrow();
  });

  it.each(["", "Not/AZone", "UTC * * * * * *"])("rejects invalid time zone %s", (zone) => {
    expect(() => new CronExpressionBuilder().withTimeZone(zone)).toThrow();
  });

  it("rejects invalid period names, including Object prototype keys", () => {
    for (const period of ["year", "__proto__", "constructor"]) {
      expect(() => new CronExpressionBuilder().each(period as CronPeriod)).toThrow();
      expect(() => new CronExpressionBuilder().on(period as CronPeriod, 1)).toThrow();
      expect(() => new CronExpressionBuilder().through(period as CronPeriod, 1, 2)).toThrow(RangeError);
      expect(() => new CronExpressionBuilder().every(period as CronPeriod, 1)).toThrow(RangeError);
    }
  });

  it("keeps fluent mutations local to the builder and preserves its state after a failed update", () => {
    const builder = new CronExpressionBuilder();
    expect(builder.on("minute", 10, 2, 10)).toBe(builder);
    expect(builder.through("hour", 8, 17)).toBe(builder);
    expect(builder.every("second", 1)).toBe(builder);
    expect(builder.each("dayOfWeek")).toBe(builder);
    expect(builder.withTimeZone("UTC")).toBe(builder);
    const expression = builder.toString();
    expect(expression).toBe("CRON_TZ=UTC */1 2,10 8-17 * * *");
    expect(() => builder.on("minute", 5, 60)).toThrow(RangeError);
    expect(() => builder.through("hour", -1, 12)).toThrow(RangeError);
    expect(() => builder.withTimeZone("Not/AZone")).toThrow(RangeError);
    expect(builder.toString()).toBe(expression);
    expect(new CronExpressionBuilder().toString()).toBe("* * * * * *");
    expect(builder.withTimeZone("America/New_York").toString()).toBe("CRON_TZ=America/New_York */1 2,10 8-17 * * *");
  });
});

describe("Jobs encoding", () => {
  it.each(["", " ", " name", "name ", ".", "..", "a/b", "a\\b", "a?b", "a#b", "a%b", "a|b", "a\nb"])(
    "rejects unsafe callback name %j",
    (name) => expect(() => validateJobName(name)).toThrow(),
  );

  it.each([{}, { dueTime: "" }, { schedule: "" }, { dueTime: "1s", ttl: " " }])(
    "rejects missing/empty timing fields %j",
    (options) => expect(() => encodeJob("test", options)).toThrow(),
  );

  it.each([-1, 0x100000000, 1.5, NaN, Infinity])("rejects invalid uint32 %s", (value) => {
    expect(() => encodeJob("test", { dueTime: "1s", repeats: value })).toThrow();
    expect(() =>
      encodeJob("test", { dueTime: "1s", failurePolicy: { type: "constant", interval: "1s", maxRetries: value } }),
    ).toThrow();
  });

  it.each(["0s", "-1s", "1m", "", "garbage"])("rejects invalid retry interval %s", (interval) => {
    expect(() => encodeJob("test", { dueTime: "1s", failurePolicy: { type: "constant", interval } })).toThrow();
  });

  it.each([null, false, 0, "", [0, null, false], { nested: { value: "x" } }])(
    "round-trips JSON payload %j using the runtime's Value envelope",
    (data) => {
      const encoded = encodeJob("test", { dueTime: "1s", data });
      expect(encoded.data?.typeUrl).toBe("type.googleapis.com/google.protobuf.Value");
      expect(decodeJob(encoded).data).toEqual(data);
    },
  );

  it("preserves optional fields, zero repeats, and zero versus absent maxRetries", () => {
    expect(decodeJob(encodeJob("test", { dueTime: "1s" })).repeats).toBeUndefined();
    for (const maxRetries of [undefined, 0, 4]) {
      const options: JobOptions = {
        schedule: new CronExpressionBuilder().on("second", 0),
        dueTime: "2030-01-01T00:00:00Z",
        ttl: "PT1H",
        repeats: 0,
        failurePolicy: { type: "constant", interval: "0.125s", maxRetries },
      };
      expect(decodeJob(encodeJob("test", options))).toMatchObject({
        ...options,
        name: "test",
        schedule: "0 * * * * *",
      });
    }
    expect(decodeJob(encodeJob("test", { dueTime: "1s", failurePolicy: { type: "drop" } })).failurePolicy).toEqual({
      type: "drop",
    });
  });

  it("preserves opaque bytes including empty buffers and subarrays", () => {
    for (const data of [Buffer.alloc(0), Uint8Array.from([7, 0, 128, 255, 7]).subarray(1, 4)]) {
      const encoded = encodeJob("test", { dueTime: "1s", data });
      expect(encoded.data?.typeUrl).toBe("dapr.io/schedule/jobpayload");
      expect(decodeJob(encoded).data).toEqual(Buffer.from(data));
    }
    expect(decodeJobData()).toBeUndefined();
    expect(decodeJobData(anyPack(StructSchema, fromJson(StructSchema, { value: false })))).toEqual({ value: false });
    expect(() =>
      decodeJobData(
        create(AnySchema, { typeUrl: "type.googleapis.com/google.protobuf.Value", value: Uint8Array.of(255) }),
      ),
    ).toThrow();
    expect(() => decodeJob()).toThrow();
    expect(decodeJobData(anyPack(ValueSchema, fromJson(ValueSchema, null)))).toBeNull();
  });

  it("rejects non-JSON values and cycles instead of silently corrupting payloads", () => {
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    for (const data of [NaN, Infinity, { nested: NaN }, { missing: undefined }, new Date(), cycle]) {
      expect(() => encodeJob("test", { dueTime: "1s", data } as JobOptions)).toThrow();
    }
    const shared = { value: 1 };
    expect(decodeJob(encodeJob("test", { dueTime: "1s", data: { a: shared, b: shared } })).data).toEqual({
      a: shared,
      b: shared,
    });
  });

  it.each<[unknown, string]>([
    [undefined, "Job options are required"],
    [null, "Job options are required"],
    ["1s", "Job options are required"],
    [{ schedule: 42 }, "schedule must be a nonempty string"],
    [{ dueTime: null }, "dueTime must be a nonempty string"],
    [{ dueTime: "1s", ttl: false }, "ttl must be a nonempty string"],
    [{ dueTime: "1s", overwrite: "true" }, "overwrite must be a boolean"],
    [{ dueTime: "1s", failurePolicy: { type: "exponential" } }, "Unknown job failure policy"],
  ])("rejects invalid JavaScript options %j", (options, message) => {
    // @ts-expect-error Exercise runtime validation of untyped JavaScript options.
    expect(() => encodeJob("test", options)).toThrow(message);
  });

  it.each(["a\u0000b", "a\u001fb", "a\u007fb"])("rejects control characters in %j", (name) => {
    expect(() => validateJobName(name)).toThrow(TypeError);
  });

  it("accepts uint32 limits and the smallest positive retry interval", () => {
    expect(
      decodeJob(
        encodeJob("test", {
          dueTime: "1s",
          repeats: 0xffffffff,
          failurePolicy: { type: "constant", interval: "0.000000001s", maxRetries: 0xffffffff },
        }),
      ),
    ).toMatchObject({
      repeats: 0xffffffff,
      failurePolicy: { type: "constant", interval: "0.000000001s", maxRetries: 0xffffffff },
    });
    expect(() =>
      encodeJob("test", { dueTime: "1s", failurePolicy: { type: "constant", interval: "-0.000000001s" } }),
    ).toThrow("Failure policy interval must be positive");
  });

  it("copies opaque data on encode and decode rather than aliasing caller buffers", () => {
    const input = Uint8Array.of(1, 2, 3);
    const encoded = encodeJob("test", { dueTime: "1s", data: input });
    input.fill(0);
    const decoded = decodeJobData(encoded.data);
    expect(decoded).toEqual(Buffer.from([1, 2, 3]));
    if (!Buffer.isBuffer(decoded)) {
      throw new Error("Expected an opaque Buffer payload");
    }
    decoded.fill(9);
    expect(decodeJobData(encoded.data)).toEqual(Buffer.from([1, 2, 3]));
  });

  it("rejects nameless responses, incomplete retry policies, and malformed Struct payloads", () => {
    expect(() => decodeJob(create(JobSchema))).toThrow("missing job or name");
    expect(() =>
      decodeJob(
        create(JobSchema, {
          name: "test",
          failurePolicy: { policy: { case: "constant", value: { maxRetries: 1 } } },
        }),
      ),
    ).toThrow("missing retry interval");
    expect(() =>
      decodeJobData(
        create(AnySchema, { typeUrl: "type.googleapis.com/google.protobuf.Struct", value: Uint8Array.of(255) }),
      ),
    ).toThrow();
    expect(
      decodeJobData(create(AnySchema, { typeUrl: "example.com/custom.Payload", value: Uint8Array.of(0, 255) })),
    ).toEqual(Buffer.from([0, 255]));
  });

  it("accepts null-prototype JSON objects and rejects non-JSON nested array values", () => {
    const data = Object.assign(Object.create(null), { value: "test" });
    expect(decodeJob(encodeJob("test", { dueTime: "1s", data })).data).toEqual({ value: "test" });
    for (const invalid of [1n, Symbol("test"), () => {}, [undefined], new Map(), new Set()]) {
      // @ts-expect-error Exercise runtime validation of non-JSON values from JavaScript callers.
      expect(() => encodeJob("test", { dueTime: "1s", data: invalid })).toThrow(TypeError);
    }
  });
});
