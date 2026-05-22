/*
Copyright 2023 The Dapr Authors
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
 * Response from a state save/upsert operation.
 *
 * Contains success/error information for a save request.
 * If the save succeeded, the error field is undefined.
 * If the save failed, error contains details about what went wrong.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/ | Dapr State Management}
 *
 * @example
 * ```typescript
 * const response: StateSaveResponseType = await client.state.save("my-store", [{
 *   key: "key-123",
 *   value: { data: "value" }
 * }]);
 *
 * if (response.error) {
 *   console.error("Save failed:", response.error.message);
 * } else {
 *   console.log("Save succeeded");
 * }
 * ```
 */
export type StateSaveResponseType = {
  /**
   * Error encountered during the save operation, if any.
   * Undefined if the save succeeded.
   * When present, contains error details about why the operation failed
   * (e.g., ETag mismatch, store unavailable, etc.).
   */
  error?: Error;
};
