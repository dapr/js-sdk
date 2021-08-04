export default interface DemoActorTimerInterface {
  init(): Promise<string>;
  getCounter(): Promise<number>;
  count(): Promise<void>;
  countBy(amount: string): Promise<void>;
}