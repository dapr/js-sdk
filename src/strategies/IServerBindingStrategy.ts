import { TypeDaprBindingCallback } from "../types/DaprBindingCallback.type";

export default interface IServerBindingStrategy {
    receive(bindingName: string, cb: TypeDaprBindingCallback): Promise<any>;
}