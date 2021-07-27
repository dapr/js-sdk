import { TypeDaprInvokerCallback } from "../types/DaprInvokerCallback.type";
import { InvokerListenOptionsType } from "../types/InvokerListenOptions.type";

export default interface IServerInvokerStrategy {
    listen(methodName: string, cb: TypeDaprInvokerCallback, options?: InvokerListenOptionsType): Promise<any>;
}