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

import { TypeDaprJobsCallback } from "../../types/DaprJobsCallback.type";

export default interface IServerJobs {
  listen(jobName: string, callback: TypeDaprJobsCallback): void;

  listen<DataType>(jobName: string, callback: TypeDaprJobsCallback<DataType>): void;
}
