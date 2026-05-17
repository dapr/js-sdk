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

/**
 * Dapr client interface for sidecar management.
 * Provides methods to control the Dapr sidecar process.
 *
 * @see https://docs.dapr.io/concepts/dapr-services/sidecar/
 */
export default interface IClientSidecar {
  /**
   * Gracefully shuts down the Dapr sidecar.
   * Allows the sidecar to complete in-flight requests before terminating.
   *
   * @returns A promise that resolves when the sidecar has been shut down.
   *
   * @see https://docs.dapr.io/concepts/dapr-services/sidecar/
   */
  shutdown(): Promise<void>;
}
