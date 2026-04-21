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

import HTTPServerJobs from "../../../src/implementation/Server/HTTPServer/jobs";
import { JobEvent } from "../../../src/types/jobs/JobEvent";
import { JobEventHandler } from "../../../src/interfaces/Server/IServerJobs";
import HttpStatusCode from "../../../src/enum/HttpStatusCode.enum";

describe("HTTPServerJobs", () => {
  /** Build a minimal mock HTTPServer that captures registered express routes. */
  const makeServer = () => {
    const routes: { path: string; handler: Function }[] = [];

    const mockExpressApp = {
      post: (path: string, handler: Function) => {
        routes.push({ path, handler });
      },
    };

    const mockHTTPServer = {
      getServer: jest.fn().mockResolvedValue(mockExpressApp),
      client: {
        options: {
          logger: undefined,
        },
      },
    } as any;

    return { mockHTTPServer, routes };
  };

  /** Simulate an express request/response pair. */
  const makeReqRes = (body: unknown = {}) => {
    const req = {
      body,
      setTimeout: jest.fn(),
    };
    const res = {
      statusCode: 0,
      end: jest.fn().mockReturnValue(undefined),
    };
    return { req, res };
  };

  describe("addJobEventHandler()", () => {
    it("registers a POST route at /job/<name>", async () => {
      const { mockHTTPServer, routes } = makeServer();
      const jobs = new HTTPServerJobs(mockHTTPServer);

      await jobs.addJobEventHandler("my-job", jest.fn());

      expect(routes).toHaveLength(1);
      expect(routes[0].path).toBe("/job/my-job");
    });

    it("dispatches a JobEvent with the correct name and body data", async () => {
      const { mockHTTPServer, routes } = makeServer();
      const jobs = new HTTPServerJobs(mockHTTPServer);

      const received: JobEvent[] = [];
      const handler: JobEventHandler = async (event) => {
        received.push(event);
      };

      await jobs.addJobEventHandler("process-order", handler);

      const { req, res } = makeReqRes({ orderId: 42 });
      await routes[0].handler(req, res);

      expect(received).toHaveLength(1);
      expect(received[0].name).toBe("process-order");
      expect(received[0].data).toEqual({ orderId: 42 });
      expect(res.statusCode).toBe(HttpStatusCode.OK);
    });

    it("returns 500 and error JSON when the handler throws", async () => {
      const { mockHTTPServer, routes } = makeServer();
      const jobs = new HTTPServerJobs(mockHTTPServer);

      const failingHandler: JobEventHandler = async () => {
        throw new Error("handler error");
      };

      await jobs.addJobEventHandler("failing-job", failingHandler);

      const { req, res } = makeReqRes({});
      await routes[0].handler(req, res);

      expect(res.statusCode).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(res.end.mock.calls[0][0]);
      expect(body.error).toBe("JOB_HANDLER_FAILED");
      expect(body.error_msg).toContain("failing-job");
    });

    it("registers distinct routes for different job names", async () => {
      const { mockHTTPServer, routes } = makeServer();
      const jobs = new HTTPServerJobs(mockHTTPServer);

      await jobs.addJobEventHandler("job-alpha", jest.fn());
      await jobs.addJobEventHandler("job-beta", jest.fn());

      const paths = routes.map((r) => r.path);
      expect(paths).toContain("/job/job-alpha");
      expect(paths).toContain("/job/job-beta");
    });

    it("dispatches to the correct handler when multiple jobs are registered", async () => {
      const { mockHTTPServer, routes } = makeServer();
      const jobs = new HTTPServerJobs(mockHTTPServer);

      const alphaEvents: JobEvent[] = [];
      const betaEvents: JobEvent[] = [];

      await jobs.addJobEventHandler("job-alpha", async (e) => alphaEvents.push(e));
      await jobs.addJobEventHandler("job-beta", async (e) => betaEvents.push(e));

      const alphaRoute = routes.find((r) => r.path === "/job/job-alpha")!;
      const betaRoute = routes.find((r) => r.path === "/job/job-beta")!;

      const { req: reqA, res: resA } = makeReqRes({ src: "alpha" });
      const { req: reqB, res: resB } = makeReqRes({ src: "beta" });

      await alphaRoute.handler(reqA, resA);
      await betaRoute.handler(reqB, resB);

      expect(alphaEvents).toHaveLength(1);
      expect(alphaEvents[0].name).toBe("job-alpha");
      expect(betaEvents).toHaveLength(1);
      expect(betaEvents[0].name).toBe("job-beta");
    });
  });
});
