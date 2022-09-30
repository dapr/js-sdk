/*
Copyright 2022 The Dapr Authors
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

import GRPCServer from "./GRPCServer";
import IServerActor from "../../../interfaces/Server/IServerActor";
import AbstractActor from "../../../actors/runtime/AbstractActor";
import Class from "../../../types/Class";

// https://docs.dapr.io/reference/api/bindings_api/
export default class GRPCServerActor implements IServerActor {
  server: GRPCServer;

  constructor(server: GRPCServer) {
    this.server = server;
  }

  deactivateActor(_actorType: string, _actorId: string): Promise<void> {
    throw new Error("GRPC is currently not supported.");
  }

  init(): Promise<void> {
    throw new Error("GRPC is currently not supported.");
  }

  getRegisteredActors(): Promise<string[]> {
    throw new Error("GRPC is currently not supported.");
  }

  registerActor<T extends AbstractActor>(_cls: Class<T>): Promise<void> {
    throw new Error("GRPC is currently not supported.");
  }
}
