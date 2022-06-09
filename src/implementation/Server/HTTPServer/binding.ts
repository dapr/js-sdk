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

import HTTPServer from './HTTPServer';
import HttpStatusCode from '../../../enum/HttpStatusCode.enum';
import IServerBinding from '../../../interfaces/Server/IServerBinding';
import { Logger } from '../../../logger/Logger';

// https://docs.dapr.io/reference/api/bindings_api/
type FunctionDaprInputCallback = (data: any) => Promise<any>;

export default class HTTPServerBinding implements IServerBinding {
  private readonly server: HTTPServer;
  private readonly logger: Logger;

  constructor(server: HTTPServer) {
    this.server = server;
    this.logger = new Logger("HTTPServer", "Binding", server.client.options.logger);
  }

  // Receive an input from an external system
  async receive(bindingName: string, cb: FunctionDaprInputCallback) {
    const server = await this.server.getServer();

    server.options(`/${bindingName}`, (_req, res) => {
      return res.end();
    });

    server.post(`/${bindingName}`, async (req, res) => {
      req.setTimeout(60 * 1000); // amount of seconds to wait for the request CB to finalize

      try {
        await cb(req?.body);

        // we send the processing status after we are done processing
        // note: if the callback takes longer than the expected wait time in the queue, it might be that this never gets called
        // @todo: can we do this cleaner without sending the response directly?
        res.statusCode = HttpStatusCode.OK;
        return res.end();
      } catch (e) {
        res.statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;

        this.logger.error(`receive failed: ${e}`);

        return res.end(JSON.stringify({
          error: "COULD_NOT_PROCESS_CALLBACK",
          error_msg: `Something happened while processing the input binding callback`
        }));
      }
    });
  }
}
