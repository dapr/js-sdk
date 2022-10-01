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

import { CommunicationProtocolEnum, DaprClient } from "../..";
import Class from "../../types/Class";
import ActorClient from "./ActorClient/ActorClient";
import ActorId from "../ActorId";
import { DaprClientOptions } from "../../types/DaprClientOptions";

export default class ActorProxyBuilder<T> {
  actorClient: ActorClient;
  actorTypeClass: Class<T>;

  constructor(actorTypeClass: Class<T>, daprClient: DaprClient);
  constructor(
    actorTypeClass: Class<T>,
    host: string,
    port: string,
    communicationProtocol: CommunicationProtocolEnum,
    clientOptions: DaprClientOptions,
  );
  constructor(actorTypeClass: Class<T>, ...args: any[]) {
    this.actorTypeClass = actorTypeClass;

    if (args.length == 1) {
      const [daprClient] = args;
      this.actorClient = new ActorClient(
        daprClient.getDaprHost(),
        daprClient.getDaprPort(),
        daprClient.getCommunicationProtocol(),
        daprClient.getOptions(),
      );
    } else {
      const [host, port, communicationProtocol, clientOptions] = args;
      this.actorClient = new ActorClient(host, port, communicationProtocol, clientOptions);
    }
  }

  build(actorId: ActorId): T {
    const actorTypeClassName = this.actorTypeClass.name;
    const actorClient = this.actorClient;

    const handler = {
      get(_target: any, propKey: any, _receiver: any) {
        return async function (...args: any) {
          const body = args.length > 0 ? args : null;
          const res = await actorClient.actor.invoke(actorTypeClassName, actorId, propKey, body);

          return res;
        };
      },
    };

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy
    // we implement a handler that will take a method and forward it to the actor client
    const proxy = new Proxy(this.actorTypeClass, handler);

    // Return a NOT strongly typed API
    // @todo: this should return a strongly typed API as well, but requires reflection. How to do this in typescript?
    return proxy as unknown as T;
  }
}
