import { IActor } from "../../src";

export default interface FakeSimpleActorInterface extends IActor {
    actorMethod(): Promise<object>;
}