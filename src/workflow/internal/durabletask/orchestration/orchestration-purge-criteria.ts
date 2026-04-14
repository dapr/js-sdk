// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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

import { OrchestrationStatus } from "./enum/orchestration-status.enum";

export class PurgeInstanceCriteria {
  createdTimeFrom?: Date;
  createdTimeTo?: Date;
  runtimeStatusList: OrchestrationStatus[] = [];
  // default timeout 5 mins
  timeout: number = 5 * 60 * 1000;

  // Setter methods to allow users to set values later
  setCreatedTimeFrom(date: Date | undefined): void {
    this.createdTimeFrom = date;
  }

  getCreatedTimeFrom(): Date | undefined {
    return this.createdTimeFrom;
  }

  setCreatedTimeTo(date: Date | undefined): void {
    this.createdTimeTo = date;
  }

  getCreatedTimeTo(): Date | undefined {
    return this.createdTimeTo;
  }

  setRuntimeStatusList(statusList: OrchestrationStatus[]): void {
    this.runtimeStatusList = statusList;
  }

  getRuntimeStatusList(): OrchestrationStatus[] {
    return this.runtimeStatusList;
  }

  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }

  getTimeout(): number {
    return this.timeout;
  }
}
