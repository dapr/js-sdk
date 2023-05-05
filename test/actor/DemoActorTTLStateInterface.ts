export default interface DemoActorTTLStateInterface {
  init(): Promise<string>;
  getState<T>(): Promise<T | null>;
  deleteState(key: string): Promise<void>;
  setStateWithTTL<T>(key: string, value: T, ttl: number): Promise<void>;
}
