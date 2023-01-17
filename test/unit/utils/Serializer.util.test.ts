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
  describe("grpc", () => {
    it("Object should be serialized to Buffer as application/json", () => {
      const data = SerializerUtil.serializeGrpc({ Hello: "World" });
      expect(Buffer.compare(data.serializedData, Buffer.from(JSON.stringify({ Hello: "World" })))).toEqual(0);
      expect(data.contentType).toEqual("application/json");
    });

    it("Object in CloudEvent Format should be serialized to Buffer as application/cloudevents+json", () => {
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

    it("String should be serialized as text/plain and as Buffer", () => {
      const data = SerializerUtil.serializeGrpc("hello-world");
      expect(data.serializedData).toEqual(Buffer.from("hello-world"));
      expect(data.contentType).toEqual("text/plain");
    });

    it("Buffer should be serialized to Buffer as application/octet-stream", () => {
      const data = SerializerUtil.serializeGrpc(Buffer.from("hello-world"));
      expect(Buffer.compare(data.serializedData, Buffer.from("hello-world", "utf-8"))).toEqual(0);
      expect(data.contentType).toEqual("application/octet-stream");
    });

    it("Buffer object should not be serialized again", () => {
      const data = SerializerUtil.serializeGrpc(Buffer.from("Hello World"));
      expect(Buffer.compare(data.serializedData, Buffer.from("Hello World"))).toEqual(0);
      expect(data.contentType).toEqual("application/octet-stream");
    });
  });

  describe("http", () => {
    it("Object should be serialized to string as application/json", () => {
      const data = SerializerUtil.serializeHttp({ Hello: "World" });
      expect(data.serializedData).toEqual(JSON.stringify({ Hello: "World" }));
      expect(data.contentType).toEqual("application/json");
    });

    it("Object in CloudEvent Format should be serialized to string as application/cloudevents+json", () => {
      const obj = {
        id: "demo",
        source: "demo",
        type: "demo",
        specversion: "demo",
      };

      const data = SerializerUtil.serializeHttp(obj);

      expect(data.serializedData).toEqual(JSON.stringify(obj));
      expect(data.contentType).toEqual("application/cloudevents+json");
    });

    it("String should be serialized as text/plain and as Buffer", () => {
      const data = SerializerUtil.serializeHttp("hello-world");
      expect(data.serializedData).toEqual("hello-world");
      expect(data.contentType).toEqual("text/plain");
    });

    it("Buffer should be serialized to Buffer as application/octet-stream", () => {
      const data = SerializerUtil.serializeHttp(Buffer.from("hello-world"));
      expect(data.serializedData).toEqual(Buffer.from("hello-world", "utf-8"));
      expect(data.contentType).toEqual("application/octet-stream");
    });

    it("Buffer object should not be serialized again", () => {
      const data = SerializerUtil.serializeHttp(Buffer.from("Hello World"));
      expect(data.serializedData).toEqual(Buffer.from("Hello World"));
      expect(data.contentType).toEqual("application/octet-stream");
    });
  });
});
