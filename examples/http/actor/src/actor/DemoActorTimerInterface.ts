export default interface DemoActorTimerInterface {
    init(): Promise<string>;
    count(): Promise<void>;
    countBy(amount: number): Promise<void>;
}