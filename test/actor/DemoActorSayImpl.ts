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

import { AbstractActor } from "../../src";
import DemoActorSayInterface from "./DemoActorSayInterface";

export default class DemoActorSayImpl extends AbstractActor implements DemoActorSayInterface {
  sayString(msg: string): string {
    return `Actor said: "${msg}"`;
  }

  sayObject(msg: object): object {
    return { said: msg };
  }

  sayMulti(a: number, b: string, c: object, d: number[]): object {
    return {
      a: {
        value: a,
        type: typeof a,
      },
      b: {
        value: b,
        type: typeof b,
      },
      c: {
        value: c,
        type: typeof c,
      },
      d: {
        value: d,
        type: typeof d,
      },
    };
  }
}
