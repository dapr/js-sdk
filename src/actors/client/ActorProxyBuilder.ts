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

import { CommunicationProtocolEnum, DaprClient, DaprClientOptions } from "../..";
import ActorClient from "./ActorClient/ActorClient";
import ActorId from "../ActorId";
import Class from "../../types/Class";

export default class ActorProxyBuilder<T> {
  // The registered actor name
  actorTypeName: string;
  actorClient: ActorClient;
  actorAbstractClass: Class<T>;

  constructor(actorTypeClass: Class<T>, daprClient: DaprClient);
  constructor(
    actorTypeClass: Class<T>,
    host: string,
    port: string,
    communicationProtocol: CommunicationProtocolEnum,
    clientOptions: DaprClientOptions,
  );
  constructor(
    actorTypeName: string,
    actorTypeClass: Class<T>,
    daprClient: DaprClient
  );
  constructor(
    actorTypeName: string,
    actorTypeClass: Class<T>,
    host: string,
    port: string,
    communicationProtocol: CommunicationProtocolEnum,
    clientOptions: DaprClientOptions,
  );
  constructor(...args: any[]) {
    let actorTypeName: string;
    let actorTypeClass: Class<T>;
    let rest: any[];

    // Determine if the first argument is a string (actorTypeName) or a class
    if (typeof args[0] === "string") {
      actorTypeName = args[0];
      actorTypeClass = args[1];
      rest = args.slice(2);
    } else {
      actorTypeClass = args[0];
      actorTypeName = actorTypeClass.name;
      rest = args.slice(1);
    }

    this.actorTypeName = actorTypeName;
    this.actorAbstractClass = actorTypeClass;

    // Create the actor client based on the provided arguments
    if (rest.length == 1) {
      const [daprClient] = rest;
      this.actorClient = new ActorClient(
        daprClient.options.daprHost,
        daprClient.options.daprPort,
        daprClient.options.communicationProtocol,
        daprClient.options,
      );
    } else {
      const [host, port, communicationProtocol, clientOptions] = rest;
      this.actorClient = new ActorClient(host, port, communicationProtocol, clientOptions);
    }
  }

  build(actorId?: ActorId | string): T {
    const actorIdParsed = actorId ? (actorId instanceof ActorId ? actorId : new ActorId(actorId)) : ActorId.createRandomId();
    const actorClient = this.actorClient;
    const actorTypeName = this.actorTypeName;

    // Create an instance of the abstract class to inspect its methods
    // This won't be used directly but helps with method discovery
    const methodNames = Object.getOwnPropertyNames(this.actorAbstractClass.prototype)
      .filter(prop => prop !== 'constructor');

    // Create the handler for the proxy
    const handler = {
      get: (_target: any, prop: any) => {
        // Ensure the property exists on the abstract class prototype
        if (!methodNames.includes(prop)) {
          throw new Error(`Method ${prop} is not defined in the actor class.`);
        }

        // Proxy the method call to the actor client
        return async function (...args: any) {
          const body = args.length > 0 ? args : null;
          const res = await actorClient.actor.invoke(actorTypeName, actorIdParsed, prop, body);
          return res;
        };
      },
    };

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy
    // we implement a handler that will take a method and forward it to the actor client
    const proxy = new Proxy(this.actorAbstractClass, handler);
    return proxy as unknown as T;
  }
}
