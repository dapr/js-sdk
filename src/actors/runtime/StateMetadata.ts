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

import StateChangeKind from "./StateChangeKind";

export default class StateMetadata<T> {
  private value: T;
  private changeKind: StateChangeKind;
  private ttl?: number;
  constructor(value: T, changeKind: StateChangeKind, ttl?: number) {
    this.value = value;
    this.changeKind = changeKind;
    this.ttl = ttl;

  }

  getValue(): T {
    return this.value;
  }

  getChangeKind(): StateChangeKind {
    return this.changeKind;
  }

  setValue(value: T): void {
    this.value = value;
  }

  setChangeKind(changeKind: StateChangeKind): void {
    this.changeKind = changeKind;
  }
  getTTL(): number | undefined {
    return this.ttl;
  }

  setTTL(ttl: number): void {
    this.ttl = ttl;
  }
}
