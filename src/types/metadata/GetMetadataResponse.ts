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

import { KeyValueType } from "../KeyValue.type";

export type GetMetadataResponse = {
  id: string;
  actors: MetadataRegisteredActor[]
  extended: KeyValueType;
  components: MetadataComponent[]
}

type MetadataRegisteredActor = {
  type: string;
  count: number;
}

type MetadataComponent = {
  name: string;
  type: string;
  version: string;
}