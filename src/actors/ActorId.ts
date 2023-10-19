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

import { randomUUID } from "crypto";

export default class ActorId {
  private readonly id: string;

  constructor(id: string) {
    if (!id) {
        throw new Error("ActorId cannot be empty");
    }
    this.id = encodeURIComponent(id);
  }

  static createRandomId(): ActorId {
    return new ActorId(randomUUID());
  }

  getId() {
    return decodeURIComponent(this.id);
  }

  toString() {
    return decodeURIComponent(this.id);
  }
}
