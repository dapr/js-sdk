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
        type: typeof a
      },
      b: {
        value: b,
        type: typeof b
      },
      c: {
        value: c,
        type: typeof c
      },
      d: {
        value: d,
        type: typeof d
      }
    };
  }
}