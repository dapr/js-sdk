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
import { WorkflowGetResponseType } from "../../../types/workflow/WorkflowGetResponseType";
import { Logger } from "../../../logger/Logger";

export default class HTTPClientWorkflow implements IClientWorkflow {
    private readonly client: HTTPClient;
    private readonly logger: Logger;

    private static readonly DEFAULT_WORKFLOW_COMPONENT = "dapr";

    constructor(client: HTTPClient) {
        this.client = client;
        this.logger = new Logger("HTTPClient", "Workflow", client.options.logger);

    }
    async get(instanceId: string, workflowComponent?: string): Promise<WorkflowGetResponseType> {
        try {
            const result = await this.client.executeWithApiVersion(
                "v1.0-alpha1",
                `/workflows/${workflowComponent}/instances/${instanceId}`,
                { method: "GET" },
            );

            return result as WorkflowGetResponseType;
        } catch (e: any) {
            this.logger.error(`Error getting workflow instance: ${e.message}`);
            throw e;
        }
    }

    start(workflowName: string, input?: any, instanceId?: string | undefined, workflowComponent?: string | undefined): Promise<string> {
        throw new Error("Method not implemented.");
    }
    terminate(instanceId: string, workflowComponent?: string | undefined): Promise<any> {
        throw new Error("Method not implemented.");
    }
    pause(instanceId: string, workflowComponent?: string | undefined): Promise<any> {
        throw new Error("Method not implemented.");
    }
    resume(instanceId: string, workflowComponent?: string | undefined): Promise<any> {
        throw new Error("Method not implemented.");
    }
    purge(instanceId: string, workflowComponent?: string | undefined): Promise<any> {
        throw new Error("Method not implemented.");
    }
    raise(instanceId: string, eventName: string, input?: any, workflowComponent?: string | undefined): Promise<any> {
        throw new Error("Method not implemented.");
    }
}
