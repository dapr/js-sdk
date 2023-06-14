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

export type EncryptRequest = {
  /** Name of the component. Required. */
  componentName: string;
  /** Name (or name/version) of the key. Required. */
  keyName: string;
  /** Key wrapping algorithm to use. Required.  */
  keyWrapAlgorithm: "A256KW" | "A128CBC" | "A192CBC" | "A256CBC" | "RSA-OAEP-256" | "AES" | "RSA";
  /** DataEncryptionCipher to use to encrypt data (optional). Default is "aes-gcm". */
  dataEncryptionCipher?: "aes-gcm" | "chacha20-poly1305";
  /** If true, the encrypted document does not contain a key reference. In that case, calls to the Decrypt method must provide a key reference (name or name/version). */
  omitDecryptionKeyName?: boolean;
  /**
   * Key reference to embed in the encrypted document (name or name/version). This is helpful if the reference of the key used to decrypt the document is different from the one used to encrypt it.
   * If unset, uses the reference of the key used to encrypt the document (this is the default behavior).
   * This option is ignored if omitDecryptionKeyName is true.
   */
  decryptionKeyName?: string;
};

export type DecryptRequest = {
  /** Name of the component. Required. */
  componentName: string;
  /**
   * Name (or name/version) of the key to decrypt the message. Overrides any key reference included in the message if present.
   * This is required if the message doesn't include a key reference (i.e. was created with omit_decryption_key_name set to true).
   */
  keyName?: string;
};
