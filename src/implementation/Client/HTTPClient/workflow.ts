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

import HTTPClient from "./HTTPClient";
import IClientWorkflow from "../../../interfaces/Client/IClientWorkflow";
import { WorkflowGetResponseType } from "../../../types/workflow/WorkflowGetResponse.type";
import { Logger } from "../../../logger/Logger";
import { KeyValueType } from "../../../types/KeyValue.type";
import { WorkflowStartOptions } from "../../../types/workflow/WorkflowStartOptions.type";
import { randomUUID } from "crypto";
import { createHTTPQueryParam } from "../../../utils/Client.util";
import { WorkflowRaiseOptions } from "../../../types/workflow/WorkflowRaiseOptions.type";
import { PropertyRequiredError } from "../../../errors/PropertyRequiredError";

export default class HTTPClientWorkflow implements IClientWorkflow {
  private readonly client: HTTPClient;
  private readonly logger: Logger;

  constructor(client: HTTPClient) {
    this.client = client;
    this.logger = new Logger("HTTPClient", "Workflow", client.options.logger);
  }

  async get(instanceID: string): Promise<WorkflowGetResponseType> {
    if (!instanceID) {
      throw new PropertyRequiredError("instanceID");
    }

    try {
      const result = await this.client.executeWithApiVersion(
        "v1.0-beta1",
        `/workflows/dapr/${instanceID}`,
        { method: "GET" },
      );

      if (typeof result === "string") {
        throw new Error(`Error getting workflow instance: ${result}`);
      }

      const resultJson = result as KeyValueType;

      const response: WorkflowGetResponseType = {
        instanceID: resultJson["instanceID"],
        workflowName: resultJson["workflowName"],
        createdAt: resultJson["createdAt"] ? new Date(resultJson["createdAt"]) : new Date(),
        lastUpdatedAt: resultJson["lastUpdatedAt"] ? new Date(resultJson["lastUpdatedAt"]) : new Date(),
        runtimeStatus: resultJson["runtimeStatus"],
        properties: resultJson["properties"],
      };

      return response;
    } catch (e: any) {
      this.logger.error(`Error getting workflow instance: ${e.message}`);
      throw e;
    }
  }

  async start(
    workflowName: string,
    input?: any,
    instanceId?: string | undefined,
    options: WorkflowStartOptions = {},
  ): Promise<string> {
    if (!workflowName) {
      throw new PropertyRequiredError("workflowName");
    }

    if (!instanceId) {
      instanceId = randomUUID();
    }

    const queryParams = createHTTPQueryParam({ data: { instanceID: instanceId } });

    // Set content type if provided.
    // If not, HTTPClient will infer it from the data.
    const headers: KeyValueType = {};
    if (options.contentType) {
      headers["Content-Type"] = options.contentType;
    }

    try {
      await this.client.executeWithApiVersion(
        "v1.0-beta1",
        `/workflows/dapr/${workflowName}/start?${queryParams}`,
        {
          method: "POST",
          body: input,
          headers,
        },
      );

      return instanceId;
    } catch (e: any) {
      this.logger.error(`Error starting workflow instance: ${e.message}`);
      throw e;
    }
  }

  async raise(
    instanceId: string,
    eventName: string,
    eventData?: any,
    options: WorkflowRaiseOptions = {},
  ): Promise<void> {
    if (!instanceId) {
      throw new PropertyRequiredError("instanceID");
    }

    if (!eventName) {
      throw new PropertyRequiredError("eventName");
    }

    // Set content type if provided.
    // If not, HTTPClient will infer it from the data.
    const headers: KeyValueType = {};
    if (options.eventContentType) {
      headers["Content-Type"] = options.eventContentType;
    }

    try {
      await this.client.executeWithApiVersion(
        "v1.0-beta1",
        `/workflows/dapr/${instanceId}/raiseEvent/${eventName}`,
        {
          method: "POST",
          body: eventData,
          headers,
        },
      );
    } catch (e: any) {
      this.logger.error(`Error raising event on workflow instance: ${e.message}`);
      throw e;
    }
  }

  async terminate(instanceId: string): Promise<void> {
    await this._invokeMethod(instanceId, "terminate");
  }

  async pause(instanceId: string): Promise<void> {
    await this._invokeMethod(instanceId, "pause");
  }

  async resume(instanceId: string): Promise<void> {
    await this._invokeMethod(instanceId, "resume");
  }

  async purge(instanceId: string): Promise<void> {
    await this._invokeMethod(instanceId, "purge");
  }

  async _invokeMethod(instanceId: string, method: string): Promise<any> {
    if (!instanceId) {
      throw new PropertyRequiredError("instanceID");
    }

    if (!method) {
      throw new PropertyRequiredError("method");
    }

    try {
      await this.client.executeWithApiVersion("v1.0-beta1", `/workflows/dapr/${instanceId}/${method}`, {
        method: "POST",
      });
    } catch (e: any) {
      this.logger.error(`Error invoking ${method} on workflow instance: ${e.message}`);
      throw e;
    }
  }
}
