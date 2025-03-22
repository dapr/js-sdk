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

export default class HTTPServerJobs implements IServerJobs {
  constructor(private readonly httpServer: HTTPServer) {}

  listen<DataType>(jobName: string, callback: (data: DataType) => unknown): void {
    this.httpServer.getServer().post(`/job/${jobName}`, (request) => callback(request.body));
  }
}
