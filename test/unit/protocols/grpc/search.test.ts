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

import { CommunicationProtocolEnum, DaprClient } from "../../../../src";
import { GRPCNotSupportedError } from "../../../../src/errors/GRPCNotSupportedError";

describe("Search on gRPC clients", () => {
  it("rejects only search operations, without creating an HTTP fallback or breaking other building blocks", async () => {
    const client = new DaprClient({ communicationProtocol: CommunicationProtocolEnum.GRPC });
    const connect = jest.spyOn(client.daprClient, "getClient");
    const operations = [
      () => client.search.createIndex("store", "index"),
      () => client.search.getIndex("store", "index"),
      () => client.search.listIndexes("store"),
      () => client.search.deleteIndex("store", "index"),
      () => client.search.indexDocuments("store", "index", []),
      () => client.search.getDocuments("store", "index", []),
      () => client.search.deleteDocuments("store", "index", []),
      () => client.search.search("store", "index"),
    ];
    try {
      expect(client.state).toBeDefined();
      expect(client.pubsub).toBeDefined();
      expect(client.jobs).toBeDefined();
      for (const operation of operations) {
        await expect(operation()).rejects.toBeInstanceOf(GRPCNotSupportedError);
      }
      expect(connect).not.toHaveBeenCalled();
      expect(client.options.communicationProtocol).toBe(CommunicationProtocolEnum.GRPC);
    } finally {
      jest.restoreAllMocks();
      await client.stop();
    }
  });
});
