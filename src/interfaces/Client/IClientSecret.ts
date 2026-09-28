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
 * Dapr client interface for accessing secrets.
 * Provides methods to retrieve secrets from Dapr secret stores.
 *
 * @see https://docs.dapr.io/developing-applications/building-blocks/secrets/
 */
export default interface IClientSecret {
  /**
   * Retrieves a single secret value from the secret store.
   *
   * @param secretStoreName - The name of the secret store component.
   * @param key - The key or name of the secret to retrieve.
   * @param metadata - Optional store-specific metadata for the request.
   * Some secret stores may require additional metadata to locate the secret.
   * @returns A promise that resolves to an object containing the secret value.
   *
   * @example
   * ```ts
   * const secret = await client.secret.get(
   *   "mySecretStore",
   *   "database-password"
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/secrets_api/
   */
  get(secretStoreName: string, key: string, metadata?: string): Promise<object>;

  /**
   * Retrieves all secrets from the secret store.
   *
   * @param secretStoreName - The name of the secret store component.
   * @returns A promise that resolves to an object containing all secrets as key-value pairs.
   * Use caution when retrieving all secrets from a large secret store.
   *
   * @see https://docs.dapr.io/reference/api/secrets_api/
   */
  getBulk(secretStoreName: string): Promise<object>;
}
