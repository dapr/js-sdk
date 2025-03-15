/*
Copyright 2025 The Dapr Authors
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

import IServerJobs from "../../../interfaces/Server/IServerJobs";
import HTTPServer from "./HTTPServer";
import { Logger } from "../../../logger/Logger";
import { TypeDaprJobsCallback } from "../../../types/DaprJobsCallback.type";

export default class HTTPServerJobs implements IServerJobs {

    private readonly httpServer: HTTPServer;
    private readonly logger: Logger;

    constructor(httpServer: HTTPServer) {
        this.logger = new Logger("HTTPServer", "Jobs", httpServer.client.options.logger);
        this.httpServer = httpServer;
    }

    listen(jobName: string, callback: TypeDaprJobsCallback): void {
        this.httpServer.getServer().post(`/job/${jobName}`, callback);
    }
}
