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

import HTTPClient from "../../../src/implementation/Client/HTTPClient/HTTPClient";
import { PropertyRequiredError } from "../../../src/errors/PropertyRequiredError";
import HTTPClientWorkflow from "../../../src/implementation/Client/HTTPClient/workflow";
import { randomUUID } from "crypto";

describe("workflow", () => {
  const client = new HTTPClient({
    daprHost: "",
    daprPort: "",
    communicationProtocol: 0,
  });
  const workflow = new HTTPClientWorkflow(client);

  it("should throw PropertyRequiredError when instanceID variable is not provided in get method", async () => {
    await expect(workflow.get("")).rejects.toThrow(PropertyRequiredError);
  });
  it("should throw PropertyRequiredError when workflowName variable is not provided in start method", async () => {
    await expect(workflow.start("")).rejects.toThrow(PropertyRequiredError);
  });
  it("should throw PropertyRequiredError when instanceID variable is not provided in _invokeMethod method", async () => {
    await expect(workflow._invokeMethod("", "raise")).rejects.toThrow(PropertyRequiredError);
  });
  it("should throw PropertyRequiredError when method variable is not provided in _invokeMethod method", async () => {
    await expect(workflow._invokeMethod(randomUUID(), "")).rejects.toThrow(PropertyRequiredError);
  });
  it("should throw PropertyRequiredError when instanceID variable is not provided in raise method", async () => {
    await expect(workflow.raise("", "Event")).rejects.toThrow(PropertyRequiredError);
  });
  it("should throw PropertyRequiredError when eventName variable is not provided in raise method", async () => {
    await expect(workflow.raise(randomUUID(), "")).rejects.toThrow(PropertyRequiredError);
  });
});
