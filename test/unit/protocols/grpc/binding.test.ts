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

import GRPCClientBinding from "../../../../src/implementation/Client/GRPCClient/binding";
import { InvokeBindingRequest } from "../../../../src/proto/dapr/proto/runtime/v1/dapr_pb";

describe("grpc/binding", () => {
  describe("send should call invokeBinding with correct arguments", () => {
    const getMockClient = (requests: any[]) => {
      const mockInvokeBinding = (req: InvokeBindingRequest, callback: any) => {
        requests.push(req);
        callback(null, {
          getData: () => {
            return "";
          },
          getMetadataMap: () => {
            return {};
          },
        });
      };
      const mockClient = {
        getClient: () => {
          return { invokeBinding: mockInvokeBinding };
        },
      } as any;
      return mockClient;
    };

    it("should create the correct binding request", async () => {
      const requests: InvokeBindingRequest[] = [];
      const grpcClientBinding = new GRPCClientBinding(getMockClient(requests));
      await grpcClientBinding.send("my-binding", "create", { key: "value" }, { mKey: "mValue" });

      // Check the request
      expect(requests.length).toBe(1);
      const binding = requests[0];
      expect(binding.getName()).toBe("my-binding");
      expect(binding.getOperation()).toBe("create");
      expect(binding.getData()).toStrictEqual(Buffer.from(JSON.stringify({ key: "value" })));
      expect(binding.getMetadataMap().getLength()).toBe(1);
      expect(binding.getMetadataMap().get("mKey")).toBe("mValue");
    });

    it("should skip data when it's not present", async () => {
      const requests: InvokeBindingRequest[] = [];
      const grpcClientBinding = new GRPCClientBinding(getMockClient(requests));
      await grpcClientBinding.send("my-binding", "create", undefined, { mKey: "mValue" });

      // Check the request
      expect(requests.length).toBe(1);
      const binding = requests[0];
      expect(binding.getName()).toBe("my-binding");
      expect(binding.getOperation()).toBe("create");
      expect(binding.getData()).toStrictEqual("");
      expect(binding.getMetadataMap().getLength()).toBe(1);
      expect(binding.getMetadataMap().get("mKey")).toBe("mValue");
    });
  });
});
