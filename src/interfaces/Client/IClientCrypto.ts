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

import { Duplex } from "stream";

import { DecryptRequest, EncryptRequest } from "../../types/crypto/Requests";

/**
 * Dapr client interface for cryptographic operations.
 * Provides methods to encrypt and decrypt data using Dapr cryptography building block.
 *
 * @see https://docs.dapr.io/developing-applications/building-blocks/cryptography/
 */
export default interface IClientCrypto {
  /**
   * Encrypts data from an input stream using the specified encryption configuration.
   *
   * @param opts - Encryption request options (key name, algorithm, key wrap algorithm).
   * @returns A promise that resolves to a readable stream of encrypted data.
   *
   * @see https://docs.dapr.io/reference/api/crypto_api/
   */
  encrypt(opts: EncryptRequest): Promise<Duplex>;

  /**
   * Encrypts data using the specified encryption configuration.
   * Accepts data in multiple formats: Buffer, ArrayBuffer, ArrayBufferView, or string.
   *
   * @param inData - The data to encrypt.
   * @param opts - Encryption request options (key name, algorithm, key wrap algorithm).
   * @returns A promise that resolves to a Buffer containing the encrypted data.
   *
   * @example
   * ```ts
   * const encrypted = await client.crypto.encrypt(
   *   Buffer.from("sensitive data"),
   *   {
   *     keyName: "my-key",
   *     algorithm: "AES-GCM"
   *   }
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/crypto_api/
   */
  encrypt(inData: Buffer | ArrayBuffer | ArrayBufferView | string, opts: EncryptRequest): Promise<Buffer>;

  /**
   * Decrypts data from an input stream using the specified decryption configuration.
   *
   * @param opts - Decryption request options (key name, algorithm, key wrap algorithm).
   * @returns A promise that resolves to a readable stream of decrypted data.
   *
   * @see https://docs.dapr.io/reference/api/crypto_api/
   */
  decrypt(opts: DecryptRequest): Promise<Duplex>;

  /**
   * Decrypts data using the specified decryption configuration.
   * Accepts data in multiple formats: Buffer, ArrayBuffer, or ArrayBufferView.
   *
   * @param inData - The encrypted data to decrypt.
   * @param opts - Decryption request options (key name, algorithm, key wrap algorithm).
   * @returns A promise that resolves to a Buffer containing the decrypted data.
   *
   * @example
   * ```ts
   * const decrypted = await client.crypto.decrypt(
   *   encryptedBuffer,
   *   {
   *     keyName: "my-key",
   *     algorithm: "AES-GCM"
   *   }
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/crypto_api/
   */
  decrypt(inData: Buffer | ArrayBuffer | ArrayBufferView, opts: DecryptRequest): Promise<Buffer>;
}
