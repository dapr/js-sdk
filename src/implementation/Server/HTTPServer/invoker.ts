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

import { DaprInvokerCallbackFunction } from "../../../types/DaprInvokerCallback.type";
import { InvokerListenOptionsType } from "../../../types/InvokerListenOptions.type";
import { HttpMethod } from "../../../enum/HttpMethod.enum";
import HTTPServer from "./HTTPServer";
import IServerInvoker from "../../../interfaces/Server/IServerInvoker";
import { Logger } from "../../../logger/Logger";
import { isJsonContentType } from "../../../serialization/Serialization.util";

// https://docs.dapr.io/reference/api/service_invocation_api/
export default class HTTPServerInvoker implements IServerInvoker {
  private readonly server: HTTPServer;
  private readonly logger: Logger;

  constructor(server: HTTPServer) {
    this.server = server;
    this.logger = new Logger("HTTPServer", "Invoker", server.client.options.logger);
  }

  async listen(methodName: string, cb: DaprInvokerCallbackFunction, options: InvokerListenOptionsType = {}) {
    const serverMethod: HttpMethod = (options?.method?.toLowerCase() as HttpMethod) || HttpMethod.GET;

    const server = await this.server.getServer();
    server[serverMethod](`/${methodName}`, async (req, res, next) => {
      try {
        const invokeResponse = await cb({
          body:
            this.server.client.options.serializer &&
            !isJsonContentType(req.headers["content-type"]) &&
            (typeof req.body === "string" || Buffer.isBuffer(req.body))
              ? req.body.toString()
              : JSON.stringify(req.body),
          query: req.originalUrl,
          metadata: {
            contentType: req.headers["content-type"],
          },
          headers: req.headers,
        });

        // Make sure we close the request after the callback
        // @TODO this should send header and http status code to client (same as grpc)

        if (!res.writableEnded) {
          if (invokeResponse || (this.server.client.options.serializer && invokeResponse !== undefined)) {
            const serializer = this.server.client.options.serializer;
            if (serializer) {
              res.type(serializer.contentType ?? "application/json");
              return res.end(serializer.serialize(invokeResponse));
            }
            return res.end(JSON.stringify(invokeResponse));
          } else {
            return res.end(JSON.stringify({ closed: true }));
          }
        }
      } catch (error) {
        next(error);
      }
    });

    this.logger.info(`Listening on ${serverMethod.toUpperCase()} /${methodName}`);
  }
}
