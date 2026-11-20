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

import { IRequestMetadata } from "../RequestMetadata.type";

/** A state value together with its ETag and component response metadata. */
export type StateGetResponseType = {
  /** The requested state key. */
  key: string;
  /** Decoded state value, or an empty string when the key is absent. */
  value: unknown;
  /** Version used for optimistic concurrency, when supplied by the state store. */
  etag?: string;
  /** Component-specific metadata. HTTP response header names are lowercased. */
  metadata: IRequestMetadata;
};
