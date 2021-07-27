export default interface IClientBindingStrategy {
    send(bindingName: string, operation: string, data: any, metadata?: object): Promise<object>;
}