export default interface DemoActorCounterInterface {
  count(): Promise<void>;
  countBy(amount: number, multiplier: number): Promise<void>;
  getCounter(): Promise<number>;
}