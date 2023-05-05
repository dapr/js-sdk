import { AbstractActor } from "../../src";
import DemoActorTTLStateInterface from "./DemoActorTTLStateInterface";

export default class DemoActorTTLStateImpl extends AbstractActor implements DemoActorTTLStateInterface {
  async init(): Promise<string> {
    await this.getStateManager().getOrAddState("data", "Hello World!");

    return "state initialized";
  }

  async getState<T>(): Promise<T | null> {
    return await this.getStateManager<T>().getState("data");
  }

  async deleteState(key: string): Promise<void> {
    await this.getStateManager().removeState(key);
    await this.getStateManager().saveState();
  }

  async setStateWithTTL<T>(key: string, value: T, ttl: number): Promise<void> {
    await this.getStateManager<T>().setStateWithTTL(key, value, ttl);
    await this.getStateManager().saveState();
  }
}
