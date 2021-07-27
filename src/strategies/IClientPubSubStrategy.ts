export default interface IClientPubSubStrategy {
    publish(pubSubName: string, topic: string, data?: object): Promise<any>
}