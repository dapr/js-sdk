import * as jspb from "google-protobuf"

import * as google_protobuf_any_pb from 'google-protobuf/google/protobuf/any_pb';
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as google_protobuf_duration_pb from 'google-protobuf/google/protobuf/duration_pb';
import * as dapr_proto_common_v1_common_pb from '../../../../dapr/proto/common/v1/common_pb';

export class InvokeServiceRequest extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getMessage(): dapr_proto_common_v1_common_pb.InvokeRequest | undefined;
  setMessage(value?: dapr_proto_common_v1_common_pb.InvokeRequest): void;
  hasMessage(): boolean;
  clearMessage(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InvokeServiceRequest.AsObject;
  static toObject(includeInstance: boolean, msg: InvokeServiceRequest): InvokeServiceRequest.AsObject;
  static serializeBinaryToWriter(message: InvokeServiceRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InvokeServiceRequest;
  static deserializeBinaryFromReader(message: InvokeServiceRequest, reader: jspb.BinaryReader): InvokeServiceRequest;
}

export namespace InvokeServiceRequest {
  export type AsObject = {
    id: string,
    message?: dapr_proto_common_v1_common_pb.InvokeRequest.AsObject,
  }
}

export class DeleteStateEnvelope extends jspb.Message {
  getStoreName(): string;
  setStoreName(value: string): void;

  getKey(): string;
  setKey(value: string): void;

  getEtag(): string;
  setEtag(value: string): void;

  getOptions(): StateOptions | undefined;
  setOptions(value?: StateOptions): void;
  hasOptions(): boolean;
  clearOptions(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteStateEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteStateEnvelope): DeleteStateEnvelope.AsObject;
  static serializeBinaryToWriter(message: DeleteStateEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteStateEnvelope;
  static deserializeBinaryFromReader(message: DeleteStateEnvelope, reader: jspb.BinaryReader): DeleteStateEnvelope;
}

export namespace DeleteStateEnvelope {
  export type AsObject = {
    storeName: string,
    key: string,
    etag: string,
    options?: StateOptions.AsObject,
  }
}

export class SaveStateEnvelope extends jspb.Message {
  getStoreName(): string;
  setStoreName(value: string): void;

  getRequestsList(): Array<StateRequest>;
  setRequestsList(value: Array<StateRequest>): void;
  clearRequestsList(): void;
  addRequests(value?: StateRequest, index?: number): StateRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SaveStateEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: SaveStateEnvelope): SaveStateEnvelope.AsObject;
  static serializeBinaryToWriter(message: SaveStateEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SaveStateEnvelope;
  static deserializeBinaryFromReader(message: SaveStateEnvelope, reader: jspb.BinaryReader): SaveStateEnvelope;
}

export namespace SaveStateEnvelope {
  export type AsObject = {
    storeName: string,
    requestsList: Array<StateRequest.AsObject>,
  }
}

export class GetStateEnvelope extends jspb.Message {
  getStoreName(): string;
  setStoreName(value: string): void;

  getKey(): string;
  setKey(value: string): void;

  getConsistency(): string;
  setConsistency(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetStateEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: GetStateEnvelope): GetStateEnvelope.AsObject;
  static serializeBinaryToWriter(message: GetStateEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetStateEnvelope;
  static deserializeBinaryFromReader(message: GetStateEnvelope, reader: jspb.BinaryReader): GetStateEnvelope;
}

export namespace GetStateEnvelope {
  export type AsObject = {
    storeName: string,
    key: string,
    consistency: string,
  }
}

export class GetStateResponseEnvelope extends jspb.Message {
  getData(): google_protobuf_any_pb.Any | undefined;
  setData(value?: google_protobuf_any_pb.Any): void;
  hasData(): boolean;
  clearData(): void;

  getEtag(): string;
  setEtag(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetStateResponseEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: GetStateResponseEnvelope): GetStateResponseEnvelope.AsObject;
  static serializeBinaryToWriter(message: GetStateResponseEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetStateResponseEnvelope;
  static deserializeBinaryFromReader(message: GetStateResponseEnvelope, reader: jspb.BinaryReader): GetStateResponseEnvelope;
}

export namespace GetStateResponseEnvelope {
  export type AsObject = {
    data?: google_protobuf_any_pb.Any.AsObject,
    etag: string,
  }
}

export class GetSecretEnvelope extends jspb.Message {
  getStoreName(): string;
  setStoreName(value: string): void;

  getKey(): string;
  setKey(value: string): void;

  getMetadataMap(): jspb.Map<string, string>;
  clearMetadataMap(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetSecretEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: GetSecretEnvelope): GetSecretEnvelope.AsObject;
  static serializeBinaryToWriter(message: GetSecretEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetSecretEnvelope;
  static deserializeBinaryFromReader(message: GetSecretEnvelope, reader: jspb.BinaryReader): GetSecretEnvelope;
}

export namespace GetSecretEnvelope {
  export type AsObject = {
    storeName: string,
    key: string,
    metadataMap: Array<[string, string]>,
  }
}

export class GetSecretResponseEnvelope extends jspb.Message {
  getDataMap(): jspb.Map<string, string>;
  clearDataMap(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetSecretResponseEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: GetSecretResponseEnvelope): GetSecretResponseEnvelope.AsObject;
  static serializeBinaryToWriter(message: GetSecretResponseEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetSecretResponseEnvelope;
  static deserializeBinaryFromReader(message: GetSecretResponseEnvelope, reader: jspb.BinaryReader): GetSecretResponseEnvelope;
}

export namespace GetSecretResponseEnvelope {
  export type AsObject = {
    dataMap: Array<[string, string]>,
  }
}

export class InvokeBindingEnvelope extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  getData(): google_protobuf_any_pb.Any | undefined;
  setData(value?: google_protobuf_any_pb.Any): void;
  hasData(): boolean;
  clearData(): void;

  getMetadataMap(): jspb.Map<string, string>;
  clearMetadataMap(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InvokeBindingEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: InvokeBindingEnvelope): InvokeBindingEnvelope.AsObject;
  static serializeBinaryToWriter(message: InvokeBindingEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InvokeBindingEnvelope;
  static deserializeBinaryFromReader(message: InvokeBindingEnvelope, reader: jspb.BinaryReader): InvokeBindingEnvelope;
}

export namespace InvokeBindingEnvelope {
  export type AsObject = {
    name: string,
    data?: google_protobuf_any_pb.Any.AsObject,
    metadataMap: Array<[string, string]>,
  }
}

export class PublishEventEnvelope extends jspb.Message {
  getTopic(): string;
  setTopic(value: string): void;

  getData(): google_protobuf_any_pb.Any | undefined;
  setData(value?: google_protobuf_any_pb.Any): void;
  hasData(): boolean;
  clearData(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PublishEventEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: PublishEventEnvelope): PublishEventEnvelope.AsObject;
  static serializeBinaryToWriter(message: PublishEventEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PublishEventEnvelope;
  static deserializeBinaryFromReader(message: PublishEventEnvelope, reader: jspb.BinaryReader): PublishEventEnvelope;
}

export namespace PublishEventEnvelope {
  export type AsObject = {
    topic: string,
    data?: google_protobuf_any_pb.Any.AsObject,
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

export class StateRequest extends jspb.Message {
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
  toObject(includeInstance?: boolean): StateRequest.AsObject;
  static toObject(includeInstance: boolean, msg: StateRequest): StateRequest.AsObject;
  static serializeBinaryToWriter(message: StateRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StateRequest;
  static deserializeBinaryFromReader(message: StateRequest, reader: jspb.BinaryReader): StateRequest;
}

export namespace StateRequest {
  export type AsObject = {
    key: string,
    value?: google_protobuf_any_pb.Any.AsObject,
    etag: string,
    metadataMap: Array<[string, string]>,
    options?: StateOptions.AsObject,
  }
}

