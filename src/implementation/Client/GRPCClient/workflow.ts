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
import { WorkflowGetResponseType } from "../../../types/workflow/WorkflowGetResponse.type";
import { GRPCNotSupportedError } from "../../../errors/GRPCNotSupportedError";

export default class GRPCClientWorkflow implements IClientWorkflow {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  get(_instanceId: string, _workflowComponent?: string | undefined): Promise<WorkflowGetResponseType> {
    throw new GRPCNotSupportedError();
  }

  start(
    _workflowName: string,
    _input?: any,
    _instanceId?: string | undefined,
    _workflowComponent?: string | undefined,
  ): Promise<string> {
    throw new GRPCNotSupportedError();
  }

  terminate(_instanceId: string, _workflowComponent?: string | undefined): Promise<any> {
    throw new GRPCNotSupportedError();
  }

  pause(_instanceId: string, _workflowComponent?: string | undefined): Promise<any> {
    throw new GRPCNotSupportedError();
  }

  resume(_instanceId: string, _workflowComponent?: string | undefined): Promise<any> {
    throw new GRPCNotSupportedError();
  }

  purge(_instanceId: string, _workflowComponent?: string | undefined): Promise<any> {
    throw new GRPCNotSupportedError();
  }

  raise(_instanceId: string, _eventName: string, _input?: any, _workflowComponent?: string | undefined): Promise<any> {
    throw new GRPCNotSupportedError();
  }
}
