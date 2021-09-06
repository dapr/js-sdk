export default interface DemoActorReminderInterface {
  init(): Promise<string>;
  count(): Promise<void>;
  getCounter(): Promise<number>;
}