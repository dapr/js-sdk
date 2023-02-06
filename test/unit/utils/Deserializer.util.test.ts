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

import * as DeserializerUtil from "../../../src/utils/Deserializer.util";

describe("deserializer", () => {
  // Helper function to run the test for both HTTP and gRPC.
  const runIt = (name: string, fn: (fnDeserialize: (contentType: string, data: any) => any) => void) => {
    it("http/" + name, () => fn(DeserializerUtil.deserializeHttp));
    it("grpc/" + name, () => fn(DeserializerUtil.deserializeGrpc));
  };

  runIt("should deserialize a buffer of type application/json to an object", (fnDeserialize) => {
    const dataRaw = { Hello: "World" };
    const data = fnDeserialize("application/json", Buffer.from(JSON.stringify(dataRaw)));

    expect(data).toEqual({ Hello: "World" });
  });

  runIt("should deserialize a Buffer of type application/cloudevents+json to an Object in CloudEvent Format", (fnDeserialize) => {
    const dataRaw = {
      id: "demo",
      source: "demo",
      type: "demo",
      specversion: "demo",
    };

    const data = fnDeserialize("application/cloudevents+json", Buffer.from(JSON.stringify(dataRaw)));
    expect(data).toEqual(dataRaw);
  });

  runIt("should deserialize a Buffer of type text/plain to a String", (fnDeserialize) => {
    const dataRaw = "hello-world";
    const data = fnDeserialize("text/plain", Buffer.from(JSON.stringify(dataRaw)));
    expect(data).toEqual(dataRaw);
  });

  runIt("should deserialize a Buffer in text/plain to a Number if possible", (fnDeserialize) => {
    const dataRaw = 123;
    const data = fnDeserialize("text/plain", Buffer.from(JSON.stringify(dataRaw)));
    expect(data).toEqual(dataRaw);
  });

  runIt("should deserialize a Buffer of text/plain to a Boolean if possible", (fnDeserialize) => {
    const dataRaw = true;
    const data = fnDeserialize("text/plain", Buffer.from(JSON.stringify(dataRaw)));
    expect(data).toEqual(dataRaw);
  });

  runIt("should deserialize a Buffer of type application/octet-stream to a Buffer", (fnDeserialize) => {
    const dataRaw = Buffer.from("hello-world");
    const data = fnDeserialize("application/octet-stream", dataRaw);
    expect(data).toEqual(dataRaw);
  });

  runIt("should deserialize a Uint8Array of type application/json to an Array", (fnDeserialize) => {
    // { "message": "Hello, world!" } as Uint8Array
    const dataRaw = new Uint8Array([
      123,  34, 109, 101, 115, 115,  97,
      103, 101,  34,  58,  34,  72, 101,
      108, 108, 111,  44,  32, 119, 111,
      114, 108, 100,  33,  34, 125
    ]);

    const data = fnDeserialize("application/json", dataRaw);
    expect(data).toEqual({ message: "Hello, world!" });
  });

  runIt("should deserialize a Uint8Array of type text/plain to an String", (fnDeserialize) => {
    // "Hello World" as Uint8Array
    const dataRaw = new Uint8Array([
      72, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33
    ]);

    const data = fnDeserialize("text/plain", dataRaw);
    expect(data).toEqual('Hello, world!');
  });
});
