export default interface DemoActorCounterInterface {
    count(): Promise<void>;
    countBy(amount: number): Promise<void>;
}