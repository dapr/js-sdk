import { AbstractActor } from "../../src";
import DemoActorActivateInterface from "./DemoActorActivateInterface";

export default class DemoActorActivateImpl extends AbstractActor implements DemoActorActivateInterface {
    isActivated: boolean = false;
    activateCallCount: number = 0;
    isDeactivated: boolean = false;
    deactivatedCallCount: number = 0;

    async onActivate(): Promise<void> {
      try {
        const callCountActivated = await this.getStateManager().getState("call_count_activated");
        await this.getStateManager().setState("is_activated", true);
        await this.getStateManager().setState("call_count_activated", callCountActivated + 1);
      } catch (e) {
        await this.getStateManager().setState("is_activated", true);
        await this.getStateManager().setState("call_count_activated", 1);
      }

      // Set the properties on activate from the state store
      const resIsActivated = await this.getStateManager().getState("is_activated");
      const resCallCountActivated = await this.getStateManager().getState("call_count_activated");
      this.isActivated = resIsActivated;
      this.activateCallCount = resCallCountActivated;

      // This will work the second time, so just catch but do nothing
      // the values are populated after deactivation
      try {
        const resCallCountDeactivated = await this.getStateManager().getState("call_count_deactivated");
        const resIsDeactivated = await this.getStateManager().getState("is_deactivated");
        this.isDeactivated = resIsDeactivated;
        this.deactivatedCallCount = resCallCountDeactivated;
      } catch (e) {
      }
    }

    async onDeactivate(): Promise<void> {
      try {
        const callCountDeactivated = await this.getStateManager().getState("call_count_deactivated");
        await this.getStateManager().setState("is_deactivated", true);
        await this.getStateManager().setState("call_count_deactivated", callCountDeactivated + 1);
      } catch (e) {
        await this.getStateManager().setState("is_deactivated", true);
        await this.getStateManager().setState("call_count_deactivated", 1);
      }
    }

    async getIsActivated(): Promise<boolean> {
      return this.isActivated;
    }

    async getIsDeactivated(): Promise<boolean> {
      return this.isDeactivated;
    }

    async getDeactivatedCallCount(): Promise<number> {
      return this.deactivatedCallCount;
    }

    async getActivatedCallCount(): Promise<number> {
      return this.activateCallCount;
    }
}