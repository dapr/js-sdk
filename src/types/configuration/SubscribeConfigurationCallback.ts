import { SubscribeConfigurationResponse } from "./SubscribeConfigurationResponse";

export type SubscribeConfigurationCallback = (res: SubscribeConfigurationResponse) => Promise<void>;