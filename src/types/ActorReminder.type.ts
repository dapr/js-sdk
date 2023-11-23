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

import { Temporal } from "@js-temporal/polyfill";

export type ActorReminderType = {
  period?: Temporal.Duration; // e.g. 0h0m9s0ms
  dueTime?: Temporal.Duration; // e.g. 1m or 0h0m0s0ms defaults to 0s
  data?: any; // the data to pass
  ttl?: Temporal.Duration; // e.g. 1m
};
