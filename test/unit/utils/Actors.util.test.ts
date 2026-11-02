/*
Copyright 2022 The Dapr Authors
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

import { ActorRuntimeOptions } from "../../../src/types/actors/ActorRuntimeOptions";
import { getRegisteredActorResponse, parseActorReminder } from "../../../src/utils/Actors.util";
import { Temporal } from "@js-temporal/polyfill";

describe("Actors.util", () => {
  describe("parseActorReminder", () => {
    afterEach(() => jest.restoreAllMocks());

    it.each([
      ["PT1H30M", 5400],
      ["P2D", 172800],
      ["1h30m0s", 5400],
      ["@every 1m30s", 90],
      ["1.5s", 1.5],
      ["250ms", 0.25],
      ["2us", 0.000002],
      ["2\u00b5s", 0.000002],
      ["2\u03bcs", 0.000002],
      ["1ns", 0.000000001],
      [".5h", 1800],
      ["0", 0],
      ["0s", 0],
      ["-1.5s", -1.5],
      ["+2m", 120],
      ["1h2m3.000000004s", 3723.000000004],
    ])("parses %s without losing subsecond precision", (period, seconds) => {
      expect(parseActorReminder({ period }).period?.total("seconds")).toBe(seconds);
    });

    it("converts absolute timestamps to durations relative to a single retrieval time", () => {
      jest.spyOn(Temporal.Now, "instant").mockReturnValue(Temporal.Instant.from("2030-01-01T00:00:00Z"));
      const result = parseActorReminder({
        dueTime: "2030-01-01T00:01:00Z",
        ttl: "2030-01-01T01:00:00.000000001Z",
      });
      expect(result.dueTime?.total("seconds")).toBe(60);
      expect(result.ttl?.total("nanoseconds")).toBe(3600000000001);
      expect(Temporal.Now.instant).toHaveBeenCalledTimes(1);
    });

    it("preserves elapsed absolute times as negative durations", () => {
      jest.spyOn(Temporal.Now, "instant").mockReturnValue(Temporal.Instant.from("2030-01-01T00:01:00Z"));
      expect(parseActorReminder({ ttl: "2030-01-01T00:00:00Z" }).ttl?.total("seconds")).toBe(-60);
    });

    it.each([
      "invalid",
      "1m junk",
      "R3/PT1M",
      "-",
      "1d",
      "PT",
      "1",
      "1s2",
      "@every ",
      "0 * * * *",
      "2030-01-01T00:00:00Z",
    ])("rejects invalid or unrepresentable periods: %s", (period) => {
      expect(() => parseActorReminder({ period })).toThrow(RangeError);
    });

    it.each([null, undefined, "not an object", []].map((response) => [response]))(
      "rejects malformed responses: %j",
      (response) => {
        expect(() => parseActorReminder(response)).toThrow(TypeError);
      },
    );

    it("rejects non-string timing fields", () => {
      expect(() => parseActorReminder({ dueTime: 123 })).toThrow(TypeError);
    });

    it("rejects durations that would lose integer precision", () => {
      expect(() => parseActorReminder({ period: "9007199254740993s" })).toThrow(RangeError);
    });

    it.each([0, false, null, "", "YWJj", { nested: [1] }, [1, false]].map((data) => [data]))(
      "preserves stored data: %j",
      (data) => {
        expect(parseActorReminder({ data }).data).toEqual(data);
      },
    );
  });

  describe("buildActorRuntimeConfigurationResponse", () => {
    it("only contains specified properties and entities", () => {
      const options: ActorRuntimeOptions = {
        drainRebalancedActors: true,
      };
      const res = getRegisteredActorResponse([], options);
      expect(res).toEqual({
        entities: [],
        drainRebalancedActors: true,
      });
    });

    it("propagates all the entities and options to response", () => {
      const options: ActorRuntimeOptions = {
        actorIdleTimeout: "1h",
        actorScanInterval: "30s",
        drainOngoingCallTimeout: "30s",
        drainRebalancedActors: true,
        remindersStoragePartitions: 1,
        reentrancy: {
          enabled: true,
          maxStackDepth: 10,
        },
      };
      const res = getRegisteredActorResponse(["e1", "e2"], options);
      expect(res).toEqual({
        entities: ["e1", "e2"],
        actorIdleTimeout: "1h",
        actorScanInterval: "30s",
        drainOngoingCallTimeout: "30s",
        drainRebalancedActors: true,
        remindersStoragePartitions: 1,
        reentrancy: {
          enabled: true,
          maxStackDepth: 10,
        },
      });
    });
  });
});
