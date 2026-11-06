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

import GRPCClientSecret from "../../../../src/implementation/Client/GRPCClient/secret";
import { GetSecretRequest } from "../../../../src/proto/dapr/proto/runtime/v1/secret_pb";

describe("grpc/secret", () => {
  const getMockClient = (requests: GetSecretRequest[], data: { [key: string]: string }) => {
    const mockGetSecret = async (req: GetSecretRequest) => {
      requests.push(req);
      return { data };
    };
    return {
      getClient: () => {
        return { getSecret: mockGetSecret };
      },
    } as any;
  };

  it("should return every key/value pair of a multi-valued secret", async () => {
    const requests: GetSecretRequest[] = [];
    const grpcClientSecret = new GRPCClientSecret(getMockClient(requests, { username: "admin", password: "p@ssw0rd" }));

    const res = await grpcClientSecret.get("kubernetes", "db-secret");

    expect(requests.length).toBe(1);
    expect(requests[0].storeName).toBe("kubernetes");
    expect(requests[0].key).toBe("db-secret");
    expect(res).toEqual({ username: "admin", password: "p@ssw0rd" });
  });

  it("should return a single-valued secret keyed by its name", async () => {
    const grpcClientSecret = new GRPCClientSecret(getMockClient([], { TEST_SECRET_1: "secret_val_1" }));

    const res = await grpcClientSecret.get("secret-envvars", "TEST_SECRET_1");

    expect(res).toEqual({ TEST_SECRET_1: "secret_val_1" });
  });

  it("should return an empty object when the secret has no values", async () => {
    const grpcClientSecret = new GRPCClientSecret(getMockClient([], {}));

    const res = await grpcClientSecret.get("secret-envvars", "MISSING");

    expect(res).toEqual({});
  });
});
