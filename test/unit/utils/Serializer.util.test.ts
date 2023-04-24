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

import * as SerializerUtil from "../../../src/utils/Serializer.util";

describe("serializer", () => {
  // Helper function to run the test for both HTTP and gRPC.
  const runIt = (name: string, fn: (fnDeserialize: (contentType: string, data: any) => any) => void) => {
    it("http/" + name, () => fn(SerializerUtil.serializeHttp));
    it("grpc/" + name, () => fn(SerializerUtil.serializeGrpc));
  };

  runIt("should serialize an object to buffer of type application/json", () => {
    const data = SerializerUtil.serializeGrpc({ Hello: "World" });
    expect(Buffer.compare(data.serializedData, Buffer.from(JSON.stringify({ Hello: "World" })))).toEqual(0);
    expect(data.contentType).toEqual("application/json");
  });

  runIt("should serialize an Object in CloudEvent Format to Buffer of type application/cloudevents+json", () => {
    const obj = {
      id: "demo",
      source: "demo",
      type: "demo",
      specversion: "demo",
    };

    const data = SerializerUtil.serializeGrpc(obj);

    expect(Buffer.compare(data.serializedData, Buffer.from(JSON.stringify(obj)))).toEqual(0);
    expect(data.contentType).toEqual("application/cloudevents+json");
  });

  runIt("should serialize a String to a Buffer of type text/plain", () => {
    const data = SerializerUtil.serializeGrpc("hello-world");
    expect(data.serializedData).toEqual(Buffer.from("hello-world"));
    expect(data.contentType).toEqual("text/plain");
  });

  runIt("should serialize a Number to Buffer of type text/plain", () => {
    const data = SerializerUtil.serializeGrpc(123);
    expect(data.serializedData).toEqual(Buffer.from("123"));
    expect(data.contentType).toEqual("text/plain");
  });

  runIt("should serialize a Boolean to Buffer of type text/plain", () => {
    const data = SerializerUtil.serializeGrpc(true);
    expect(data.serializedData).toEqual(Buffer.from("true"));
    expect(data.contentType).toEqual("text/plain");
  });

  runIt("should serialize a Buffer to Buffer of type application/octet-stream", () => {
    const data = SerializerUtil.serializeGrpc(Buffer.from("hello-world"));
    expect(Buffer.compare(data.serializedData, Buffer.from("hello-world", "utf-8"))).toEqual(0);
    expect(data.contentType).toEqual("application/octet-stream");
  });

  runIt("should not serialize a Buffer object again", () => {
    const data = SerializerUtil.serializeGrpc(Buffer.from("Hello World"));
    expect(Buffer.compare(data.serializedData, Buffer.from("Hello World"))).toEqual(0);
    expect(data.contentType).toEqual("application/octet-stream");
  });

  runIt("should not cause the body to be inflated", () => {
    const payload = new Uint8Array(5 * 1024 * 1024);
    const data = SerializerUtil.serializeGrpc(payload);

    const payloadLength = Math.round(payload.length);
    const dataLength = Math.round(Object.keys(data.serializedData).length);

    expect(payloadLength).toEqual(dataLength);
  });

  runIt("should serialize an Object as text/plain if specified", () => {
    const data = { Hello: "World" };
    const { serializedData, contentType } = SerializerUtil.serializeGrpc(data, "text/plain");
    expect(Buffer.compare(serializedData, Buffer.from(data.toString()))).toEqual(0);
    expect(contentType).toEqual("text/plain");
  });
});
