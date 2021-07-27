import { HttpMethod } from "../enum/HttpMethod.enum";

export default interface IClientInvokerStrategy {
    invoke(appId: string, methodName: string, method: HttpMethod, data?: object): Promise<object>;
}