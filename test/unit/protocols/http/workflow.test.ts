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

import HTTPClient from "../../../../src/implementation/Client/HTTPClient/HTTPClient";
import { PropertyRequiredError } from "../../../../src/errors/PropertyRequiredError";
import HTTPClientWorkflow from "../../../../src/implementation/Client/HTTPClient/workflow";
import { randomUUID } from "crypto";

describe("workflow", () => {
  const client = new HTTPClient({
    daprHost: "",
    daprPort: "",
    communicationProtocol: 0,
  });
  const workflow = new HTTPClientWorkflow(client);

  it("should throw PropertyRequiredError when instanceID variable is not provided in getWorkflowState method", async () => {
    await expect(workflow.getWorkflowState("")).rejects.toThrow(PropertyRequiredError);
  });
  it("should throw PropertyRequiredError when workflowName variable is not provided in scheduleNewWorkflow method", async () => {
    await expect(workflow.scheduleNewWorkflow("")).rejects.toThrow(PropertyRequiredError);
  });
  it("should throw PropertyRequiredError when instanceID variable is not provided in _invokeMethod method", async () => {
    await expect(workflow._invokeMethod("", "raiseEvent")).rejects.toThrow(PropertyRequiredError);
  });
  it("should throw PropertyRequiredError when method variable is not provided in _invokeMethod method", async () => {
    await expect(workflow._invokeMethod(randomUUID(), "")).rejects.toThrow(PropertyRequiredError);
  });
  it("should throw PropertyRequiredError when instanceID variable is not provided in raiseEvent method", async () => {
    await expect(workflow.raiseEvent("", "Event")).rejects.toThrow(PropertyRequiredError);
  });
  it("should throw PropertyRequiredError when eventName variable is not provided in raiseEvent method", async () => {
    await expect(workflow.raiseEvent(randomUUID(), "")).rejects.toThrow(PropertyRequiredError);
  });
  describe("terminate", () => {
    it("sends a termination reason as a query parameter", async () => {
      const reason = "operator requested & confirmed";
      const execute = jest.spyOn(client, "executeWithApiVersion").mockResolvedValue({});

      try {
        await workflow.terminate("instance-1", reason);

        expect(execute).toHaveBeenCalledWith(
          "v1.0-beta1",
          `/workflows/dapr/instance-1/terminate?reason=${encodeURIComponent(reason)}`,
          { method: "POST" },
        );
      } finally {
        execute.mockRestore();
      }
    });

    it("preserves an explicitly empty termination reason", async () => {
      const execute = jest.spyOn(client, "executeWithApiVersion").mockResolvedValue({});

      try {
        await workflow.terminate("instance-1", "");

        expect(execute).toHaveBeenCalledWith(
          "v1.0-beta1",
          "/workflows/dapr/instance-1/terminate?reason=",
          { method: "POST" },
        );
      } finally {
        execute.mockRestore();
      }
    });

    it("omits the termination reason when it is undefined", async () => {
      const execute = jest.spyOn(client, "executeWithApiVersion").mockResolvedValue({});

      try {
        await workflow.terminate("instance-1");

        expect(execute).toHaveBeenCalledWith(
          "v1.0-beta1",
          "/workflows/dapr/instance-1/terminate",
          { method: "POST" },
        );
      } finally {
        execute.mockRestore();
      }
    });
  });

});
