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

import DaprPubSubStatusEnum from "../../enum/DaprPubSubStatus.enum";

// TODO @DeepanshuA to specify correct line number here
// https://github.com/dapr/dapr/blob/master/pkg/apis/subscriptions/v2alpha1/types.go#L53

/**
 * BulkSubscribeResponseEntry is the response entry for a bulk subscribe request
 **/
export type BulkSubscribeResponseEntry = {
  // The id of the bulk subscribe entry
  entryId: string;

  // The response status of the bulk subscribe entry
  status: DaprPubSubStatusEnum;
};