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

import GRPCClient from "./GRPCClient";
import IClientWorkflow from "../../../interfaces/Client/IClientWorkflow";
import { WorkflowGetResponseType } from "../../../types/workflow/WorkflowGetResponseType";

export default class GRPCClientWorkflow implements IClientWorkflow {
    client: GRPCClient;

    constructor(client: GRPCClient) {
        this.client = client;
    }
    get(instanceId: string, workflowComponent?: string | undefined): Promise<WorkflowGetResponseType> {
        throw new Error("Method not implemented.");
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
