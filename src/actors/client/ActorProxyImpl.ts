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

import Class from "../../types/Class";
import ActorClient from "./ActorClient/ActorClient";
import ActorId from "../ActorId";

export default class ActorProxyImpl<T> {
  actorClient: ActorClient;
  actorTypeClass: Class<T>;
  actorId: ActorId;

  constructor(actorTypeClass: Class<T>, actorId: ActorId, actorClient: ActorClient) {
    this.actorTypeClass = actorTypeClass;
    this.actorClient = actorClient;
    this.actorId = actorId;
  }
}
