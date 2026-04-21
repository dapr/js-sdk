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

import HTTPServer from "./HTTPServer";
import HttpStatusCode from "../../../enum/HttpStatusCode.enum";
import IServerJobs, { JobEventHandler } from "../../../interfaces/Server/IServerJobs";
import { Logger } from "../../../logger/Logger";

// https://docs.dapr.io/reference/api/jobs_api/
export default class HTTPServerJobs implements IServerJobs {
  private readonly server: HTTPServer;
  private readonly logger: Logger;

  constructor(server: HTTPServer) {
    this.server = server;
    this.logger = new Logger("HTTPServer", "Jobs", server.client.options.logger);
  }

  async addJobEventHandler(name: string, handler: JobEventHandler): Promise<void> {
    const server = await this.server.getServer();

    server.post(`/job/${name}`, async (req, res) => {
      req.setTimeout(60 * 1000);

      try {
        await handler({ name, data: req?.body });
        res.statusCode = HttpStatusCode.OK;
        return res.end();
      } catch (e) {
        this.logger.error(`Job handler failed for '${name}': ${e}`);
        res.statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
        return res.end(
          JSON.stringify({
            error: "JOB_HANDLER_FAILED",
            error_msg: `Error processing job '${name}'`,
          }),
        );
      }
    });
  }
}
