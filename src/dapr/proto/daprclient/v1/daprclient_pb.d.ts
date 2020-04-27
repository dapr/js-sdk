import * as jspb from "google-protobuf"

import * as google_protobuf_any_pb from 'google-protobuf/google/protobuf/any_pb';
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as google_protobuf_duration_pb from 'google-protobuf/google/protobuf/duration_pb';
import * as dapr_proto_common_v1_common_pb from '../../../../dapr/proto/common/v1/common_pb';

export class CloudEventEnvelope extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getSource(): string;
  setSource(value: string): void;

  getType(): string;
  setType(value: string): void;

  getSpecversion(): string;
  setSpecversion(value: string): void;

  getDataContentType(): string;
  setDataContentType(value: string): void;

  getTopic(): string;
  setTopic(value: string): void;

  getData(): google_protobuf_any_pb.Any | undefined;
  setData(value?: google_protobuf_any_pb.Any): void;
  hasData(): boolean;
  clearData(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CloudEventEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: CloudEventEnvelope): CloudEventEnvelope.AsObject;
  static serializeBinaryToWriter(message: CloudEventEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CloudEventEnvelope;
  static deserializeBinaryFromReader(message: CloudEventEnvelope, reader: jspb.BinaryReader): CloudEventEnvelope;
}

export namespace CloudEventEnvelope {
  export type AsObject = {
    id: string,
    source: string,
    type: string,
    specversion: string,
    dataContentType: string,
    topic: string,
    data?: google_protobuf_any_pb.Any.AsObject,
  }
}

export class BindingEventEnvelope extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  getData(): google_protobuf_any_pb.Any | undefined;
  setData(value?: google_protobuf_any_pb.Any): void;
  hasData(): boolean;
  clearData(): void;

  getMetadataMap(): jspb.Map<string, string>;
  clearMetadataMap(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BindingEventEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: BindingEventEnvelope): BindingEventEnvelope.AsObject;
  static serializeBinaryToWriter(message: BindingEventEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BindingEventEnvelope;
  static deserializeBinaryFromReader(message: BindingEventEnvelope, reader: jspb.BinaryReader): BindingEventEnvelope;
}

export namespace BindingEventEnvelope {
  export type AsObject = {
    name: string,
    data?: google_protobuf_any_pb.Any.AsObject,
    metadataMap: Array<[string, string]>,
  }
}

export class BindingResponseEnvelope extends jspb.Message {
  getData(): google_protobuf_any_pb.Any | undefined;
  setData(value?: google_protobuf_any_pb.Any): void;
  hasData(): boolean;
  clearData(): void;

  getToList(): Array<string>;
  setToList(value: Array<string>): void;
  clearToList(): void;
  addTo(value: string, index?: number): void;

  getStateList(): Array<State>;
  setStateList(value: Array<State>): void;
  clearStateList(): void;
  addState(value?: State, index?: number): State;

  getConcurrency(): string;
  setConcurrency(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BindingResponseEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: BindingResponseEnvelope): BindingResponseEnvelope.AsObject;
  static serializeBinaryToWriter(message: BindingResponseEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BindingResponseEnvelope;
  static deserializeBinaryFromReader(message: BindingResponseEnvelope, reader: jspb.BinaryReader): BindingResponseEnvelope;
}

export namespace BindingResponseEnvelope {
  export type AsObject = {
    data?: google_protobuf_any_pb.Any.AsObject,
    toList: Array<string>,
    stateList: Array<State.AsObject>,
    concurrency: string,
  }
}

export class GetTopicSubscriptionsEnvelope extends jspb.Message {
  getTopicsList(): Array<string>;
  setTopicsList(value: Array<string>): void;
  clearTopicsList(): void;
  addTopics(value: string, index?: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetTopicSubscriptionsEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: GetTopicSubscriptionsEnvelope): GetTopicSubscriptionsEnvelope.AsObject;
  static serializeBinaryToWriter(message: GetTopicSubscriptionsEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetTopicSubscriptionsEnvelope;
  static deserializeBinaryFromReader(message: GetTopicSubscriptionsEnvelope, reader: jspb.BinaryReader): GetTopicSubscriptionsEnvelope;
}

export namespace GetTopicSubscriptionsEnvelope {
  export type AsObject = {
    topicsList: Array<string>,
  }
}

export class GetBindingsSubscriptionsEnvelope extends jspb.Message {
  getBindingsList(): Array<string>;
  setBindingsList(value: Array<string>): void;
  clearBindingsList(): void;
  addBindings(value: string, index?: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetBindingsSubscriptionsEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: GetBindingsSubscriptionsEnvelope): GetBindingsSubscriptionsEnvelope.AsObject;
  static serializeBinaryToWriter(message: GetBindingsSubscriptionsEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetBindingsSubscriptionsEnvelope;
  static deserializeBinaryFromReader(message: GetBindingsSubscriptionsEnvelope, reader: jspb.BinaryReader): GetBindingsSubscriptionsEnvelope;
}

export namespace GetBindingsSubscriptionsEnvelope {
  export type AsObject = {
    bindingsList: Array<string>,
  }
}

export class State extends jspb.Message {
  getKey(): string;
  setKey(value: string): void;

  getValue(): google_protobuf_any_pb.Any | undefined;
  setValue(value?: google_protobuf_any_pb.Any): void;
  hasValue(): boolean;
  clearValue(): void;

  getEtag(): string;
  setEtag(value: string): void;

  getMetadataMap(): jspb.Map<string, string>;
  clearMetadataMap(): void;

  getOptions(): StateOptions | undefined;
  setOptions(value?: StateOptions): void;
  hasOptions(): boolean;
  clearOptions(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): State.AsObject;
  static toObject(includeInstance: boolean, msg: State): State.AsObject;
  static serializeBinaryToWriter(message: State, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): State;
  static deserializeBinaryFromReader(message: State, reader: jspb.BinaryReader): State;
}

export namespace State {
  export type AsObject = {
    key: string,
    value?: google_protobuf_any_pb.Any.AsObject,
    etag: string,
    metadataMap: Array<[string, string]>,
    options?: StateOptions.AsObject,
  }
}

export class StateOptions extends jspb.Message {
  getConcurrency(): string;
  setConcurrency(value: string): void;

  getConsistency(): string;
  setConsistency(value: string): void;

  getRetryPolicy(): RetryPolicy | undefined;
  setRetryPolicy(value?: RetryPolicy): void;
  hasRetryPolicy(): boolean;
  clearRetryPolicy(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StateOptions.AsObject;
  static toObject(includeInstance: boolean, msg: StateOptions): StateOptions.AsObject;
  static serializeBinaryToWriter(message: StateOptions, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StateOptions;
  static deserializeBinaryFromReader(message: StateOptions, reader: jspb.BinaryReader): StateOptions;
}

export namespace StateOptions {
  export type AsObject = {
    concurrency: string,
    consistency: string,
    retryPolicy?: RetryPolicy.AsObject,
  }
}

export class RetryPolicy extends jspb.Message {
  getThreshold(): number;
  setThreshold(value: number): void;

  getPattern(): string;
  setPattern(value: string): void;

  getInterval(): google_protobuf_duration_pb.Duration | undefined;
  setInterval(value?: google_protobuf_duration_pb.Duration): void;
  hasInterval(): boolean;
  clearInterval(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RetryPolicy.AsObject;
  static toObject(includeInstance: boolean, msg: RetryPolicy): RetryPolicy.AsObject;
  static serializeBinaryToWriter(message: RetryPolicy, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RetryPolicy;
  static deserializeBinaryFromReader(message: RetryPolicy, reader: jspb.BinaryReader): RetryPolicy;
}

export namespace RetryPolicy {
  export type AsObject = {
    threshold: number,
    pattern: string,
    interval?: google_protobuf_duration_pb.Duration.AsObject,
  }
}

