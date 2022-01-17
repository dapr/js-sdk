import { KeyValueType } from "../KeyValue.type";

export type ConfigurationItem = {
  key: string;
  value: string;
  version: string;
  metadata: KeyValueType;
}