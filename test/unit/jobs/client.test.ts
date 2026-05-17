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

import HTTPClient from "../../../src/implementation/Client/HTTPClient/HTTPClient";
import HTTPClientJobs from "../../../src/implementation/Client/HTTPClient/jobs";
import { ScheduleJobRequest } from "../../../src/types/jobs/ScheduleJobRequest";

describe("HTTPClientJobs", () => {
  let httpClient: HTTPClient;
  let jobs: HTTPClientJobs;
  let executeSpy: jest.SpyInstance;

  beforeEach(() => {
    httpClient = new HTTPClient({
      daprHost: "127.0.0.1",
      daprPort: "3500",
      communicationProtocol: 0,
    });
    jobs = new HTTPClientJobs(httpClient);
    executeSpy = jest.spyOn(httpClient, "executeWithApiVersion").mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("schedule()", () => {
    it("should send a POST to /jobs/:name with the correct body and without name in body", async () => {
      const job: ScheduleJobRequest = {
        name: "my-job",
        schedule: "0 * * * *",
        repeats: 10,
      };

      await jobs.schedule(job);

      expect(executeSpy).toHaveBeenCalledTimes(1);
      const [apiVersion, url, params] = executeSpy.mock.calls[0];
      expect(apiVersion).toBe("v1.0-alpha1");
      expect(url).toBe("/jobs/my-job");
      expect(params.method).toBe("POST");
      expect(params.body).not.toHaveProperty("name");
      expect(params.body.schedule).toBe("0 * * * *");
      expect(params.body.repeats).toBe(10);
    });

    it("should include overwrite in body when set", async () => {
      const job: ScheduleJobRequest = {
        name: "my-job",
        schedule: "@every 5s",
        overwrite: true,
      };

      await jobs.schedule(job);

      const [, , params] = executeSpy.mock.calls[0];
      expect(params.body.overwrite).toBe(true);
    });

    it("should serialize drop failure policy correctly", async () => {
      const job: ScheduleJobRequest = {
        name: "my-job",
        schedule: "@every 1m",
        failurePolicy: { type: "drop" },
      };

      await jobs.schedule(job);

      const [, , params] = executeSpy.mock.calls[0];
      expect(params.body.failurePolicy).toEqual({ drop: {} });
    });

    it("should serialize constant failure policy with interval and maxRetries", async () => {
      const job: ScheduleJobRequest = {
        name: "my-job",
        schedule: "@every 1m",
        failurePolicy: { type: "constant", interval: "5s", maxRetries: 3 },
      };

      await jobs.schedule(job);

      const [, , params] = executeSpy.mock.calls[0];
      expect(params.body.failurePolicy).toEqual({ constant: { interval: "5s", maxRetries: 3 } });
    });

    it("should serialize constant failure policy with only interval", async () => {
      const job: ScheduleJobRequest = {
        name: "my-job",
        schedule: "@every 1m",
        failurePolicy: { type: "constant", interval: "10s" },
      };

      await jobs.schedule(job);

      const [, , params] = executeSpy.mock.calls[0];
      expect(params.body.failurePolicy).toEqual({ constant: { interval: "10s" } });
    });

    it("should not include undefined fields in body", async () => {
      const job: ScheduleJobRequest = {
        name: "my-job",
        dueTime: "2026-01-01T00:00:00Z",
      };

      await jobs.schedule(job);

      const [, , params] = executeSpy.mock.calls[0];
      expect(params.body).not.toHaveProperty("schedule");
      expect(params.body).not.toHaveProperty("repeats");
      expect(params.body).not.toHaveProperty("ttl");
      expect(params.body).not.toHaveProperty("failurePolicy");
      expect(params.body.dueTime).toBe("2026-01-01T00:00:00Z");
    });
  });

  describe("get()", () => {
    it("should send a GET to /jobs/:name and return a deserialized Job", async () => {
      executeSpy.mockResolvedValueOnce({
        schedule: "@every 1m",
        repeats: 5,
        ttl: "1h",
      });

      const result = await jobs.get("my-job");

      expect(executeSpy).toHaveBeenCalledTimes(1);
      const [apiVersion, url, params] = executeSpy.mock.calls[0];
      expect(apiVersion).toBe("v1.0-alpha1");
      expect(url).toBe("/jobs/my-job");
      expect(params.method).toBe("GET");

      expect(result.name).toBe("my-job");
      expect(result.schedule).toBe("@every 1m");
      expect(result.repeats).toBe(5);
      expect(result.ttl).toBe("1h");
    });

    it("should deserialize drop failure policy from HTTP response", async () => {
      executeSpy.mockResolvedValueOnce({
        schedule: "@every 1m",
        failurePolicy: { drop: {} },
      });

      const result = await jobs.get("my-job");

      expect(result.failurePolicy).toEqual({ type: "drop" });
    });

    it("should deserialize constant failure policy from HTTP response", async () => {
      executeSpy.mockResolvedValueOnce({
        schedule: "@every 1m",
        failurePolicy: { constant: { interval: "5s", maxRetries: 3 } },
      });

      const result = await jobs.get("my-job");

      expect(result.failurePolicy).toEqual({ type: "constant", interval: "5s", maxRetries: 3 });
    });

    it("should return job without optional fields when not present in response", async () => {
      executeSpy.mockResolvedValueOnce({});

      const result = await jobs.get("bare-job");

      expect(result.name).toBe("bare-job");
      expect(result.schedule).toBeUndefined();
      expect(result.failurePolicy).toBeUndefined();
    });
  });

  describe("delete()", () => {
    it("should send a DELETE to /jobs/:name", async () => {
      await jobs.delete("my-job");

      expect(executeSpy).toHaveBeenCalledTimes(1);
      const [apiVersion, url, params] = executeSpy.mock.calls[0];
      expect(apiVersion).toBe("v1.0-alpha1");
      expect(url).toBe("/jobs/my-job");
      expect(params.method).toBe("DELETE");
    });
  });
});
