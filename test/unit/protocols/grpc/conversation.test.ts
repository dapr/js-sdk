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

import GRPCClientConversation from "../../../../src/implementation/Client/GRPCClient/conversation";
import { GRPCNotSupportedError } from "../../../../src/errors/GRPCNotSupportedError";

describe("conversation - gRPC", () => {
  const mockGrpcClient = {} as any;
  const conversation = new GRPCClientConversation(mockGrpcClient);

  it("should throw GRPCNotSupportedError when converse is called", () => {
    expect(() => conversation.converse("my-llm", [])).toThrow(GRPCNotSupportedError);
  });
});
