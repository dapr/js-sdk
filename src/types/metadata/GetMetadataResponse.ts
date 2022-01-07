import { KeyValuePairType } from "../KeyValuePair.type";

export type GetMetadataResponse = {
  id: string;
  actors: MetadataRegisteredActor[]
  extended: KeyValueType;
  components: MetadataComponent[]
}

type MetadataRegisteredActor = {
  type: string;
  count: number;
}

type MetadataComponent = {
  name: string;
  type: string;
  version: string;
}