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

import { PubSubSubscriptionOptionsType } from "./PubSubSubscriptionOptions.type";

/** Options for the gRPC-only SubscribeTopicEventsAlpha1 API. */
export type PubSubStreamingSubscriptionOptions = Pick<PubSubSubscriptionOptionsType, "metadata" | "deadLetterTopic"> & {
  /** Cancels the stream, including while waiting for the initial response. */
  signal?: AbortSignal;
};

/** A client-initiated subscription using Dapr's alpha1 streaming API. */
export type PubSubStreamingSubscription = {
  /**
   * Cancels the stream. Safe to call repeatedly or from the callback.
   * Does not wait for an in-flight callback; that event is left unacknowledged.
   */
  close(): Promise<void>;
  /**
   * Resolves after cancellation and any in-flight callback have completed.
   * Rejects on transport/protocol failure or unexpected end of stream.
   * Failures are also logged. The SDK does not automatically reconnect.
   */
  readonly closed: Promise<void>;
};
