export default interface IClientSecretStrategy {
    get(secretStoreName: string, key: string, metadata?: string): Promise<object>;
    getBulk(secretStoreName: string): Promise<object>;
}