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

import HTTPClient from "./HTTPClient";
import ActorId from "../../../actors/ActorId";
import ActorProxyBuilder from "../../../actors/client/ActorProxyBuilder";
import Class from "../../../types/Class";
import IClientActorBuilder from "../../../interfaces/Client/IClientActorBuilder";

// https://docs.dapr.io/reference/api/actors_api/
export default class HTTPClientActor implements IClientActorBuilder {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  // Note: actorTypeClass is required since Javascript compiled has type information erased
  // this means that we can't use T to new up an object (sadly enough) so we have to pass it
  create<T>(actorTypeClass: Class<T>): T {
    const builder = new ActorProxyBuilder<T>(
      actorTypeClass,
      this.client.options.daprHost,
      this.client.options.daprPort,
      this.client.options.communicationProtocol,
      this.client.options
    );
    const actor = builder.build(ActorId.createRandomId());
    return actor;
  }
}
