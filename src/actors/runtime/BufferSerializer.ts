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
 * Converts between binary buffers and JavaScript values using JSON encoding.
 *
 * BufferSerializer handles the bidirectional conversion between Node.js Buffer objects
 * (used for actor method arguments and reminder/timer state) and JavaScript values. It uses
 * JSON as the serialization format:
 *
 * - **Deserialization**: Converts a Buffer to a string, then attempts JSON.parse(). If parsing
 *   fails, the string value is returned as-is. This allows graceful handling of both JSON-encoded
 *   objects and plain text values.
 *
 * - **Serialization**: Converts objects to JSON strings, strings are converted directly, and
 *   other types are stringified. The result is encoded to a Buffer.
 *
 * @remarks
 * This serializer is used internally by the actor runtime for:
 * - Deserializing actor method arguments from HTTP/gRPC payloads
 * - Deserializing reminder and timer state data
 * - Serializing actor method return values
 * - Marshaling actor invocation data through the Dapr sidecar
 *
 * The implementation is lenient—invalid JSON falls back to string representation rather than
 * throwing errors, which accommodates both structured (JSON) and unstructured (plain text) payloads.
 *
 * @internal Intended for use by the actor runtime; not typically used directly by application code.
 */
export default class BufferSerializer {
  /**
   * Converts a Buffer to a JavaScript value.
   *
   * Attempts to parse the buffer contents as JSON. If JSON parsing fails, returns the
   * string representation of the buffer. Empty or null buffers result in an empty string.
   *
   * @param data - The Buffer to deserialize (may be undefined or null).
   * @returns The deserialized value: a parsed JSON object, a string, or an empty string.
   *
   * @example
   * ```typescript
   * const serializer = new BufferSerializer();
   *
   * // JSON payload
   * const jsonBuf = Buffer.from('{"count": 42}');
   * serializer.deserialize(jsonBuf); // { count: 42 }
   *
   * // Plain text payload
   * const textBuf = Buffer.from('hello world');
   * serializer.deserialize(textBuf); // "hello world"
   *
   * // Empty buffer
   * serializer.deserialize(Buffer.from('')); // ""
   * ```
   */
  deserialize(data: Buffer): any {
    let deserializedBody: any = data?.toString() || "";

    // Try to parse it to an object
    // this way manager.invoke has string | object
    try {
      deserializedBody = JSON.parse(deserializedBody);
    } catch (e) {
      // Do nothing
    }

    return deserializedBody;
  }

  /**
   * Converts a JavaScript value to a Buffer.
   *
   * Objects are JSON-stringified, strings are used directly, and other types are converted
   * to strings. The result is encoded to a Buffer using UTF-8.
   *
   * @param data - The value to serialize (object, string, or other type).
   * @returns A UTF-8 encoded Buffer containing the serialized data.
   *
   * @example
   * ```typescript
   * const serializer = new BufferSerializer();
   *
   * // Serialize an object
   * serializer.serialize({ count: 42 });
   * // Buffer.from('{"count":42}')
   *
   * // Serialize a string
   * serializer.serialize("hello world");
   * // Buffer.from('hello world')
   *
   * // Serialize a number (converted to string)
   * serializer.serialize(42);
   * // Buffer.from('42')
   * ```
   */
  serialize(data: any): Buffer {
    let dataAsString: string;

    if (typeof data === "object") {
      dataAsString = JSON.stringify(data);
    } else {
      dataAsString = data?.toString() || "";
    }

    return Buffer.from(dataAsString);
  }
}
