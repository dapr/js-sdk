// package: dapr
// file: dapr/dapr.proto

import * as jspb from "google-protobuf";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_duration_pb from "google-protobuf/google/protobuf/duration_pb";

export class InvokeServiceResponseEnvelope extends jspb.Message {
  hasData(): boolean;
  clearData(): void;
  getData(): google_protobuf_any_pb.Any | undefined;
  setData(value?: google_protobuf_any_pb.Any): void;

  getMetadataMap(): jspb.Map<string, string>;
  clearMetadataMap(): void;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InvokeServiceResponseEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: InvokeServiceResponseEnvelope): InvokeServiceResponseEnvelope.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: InvokeServiceResponseEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InvokeServiceResponseEnvelope;
  static deserializeBinaryFromReader(message: InvokeServiceResponseEnvelope, reader: jspb.BinaryReader): InvokeServiceResponseEnvelope;
}

export namespace InvokeServiceResponseEnvelope {
  export type AsObject = {
    data?: google_protobuf_any_pb.Any.AsObject,
    metadataMap: Array<[string, string]>,
  }
}

export class DeleteStateEnvelope extends jspb.Message {
  getStorename(): string;
  setStorename(value: string): void;

  getKey(): string;
  setKey(value: string): void;

  getEtag(): string;
  setEtag(value: string): void;

  hasOptions(): boolean;
  clearOptions(): void;
  getOptions(): StateOptions | undefined;
  setOptions(value?: StateOptions): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteStateEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteStateEnvelope): DeleteStateEnvelope.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DeleteStateEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteStateEnvelope;
  static deserializeBinaryFromReader(message: DeleteStateEnvelope, reader: jspb.BinaryReader): DeleteStateEnvelope;
}

export namespace DeleteStateEnvelope {
  export type AsObject = {
    storename: string,
    key: string,
    etag: string,
    options?: StateOptions.AsObject,
  }
}

export class SaveStateEnvelope extends jspb.Message {
  getStorename(): string;
  setStorename(value: string): void;

  clearRequestsList(): void;
  getRequestsList(): Array<StateRequest>;
  setRequestsList(value: Array<StateRequest>): void;
  addRequests(value?: StateRequest, index?: number): StateRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SaveStateEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: SaveStateEnvelope): SaveStateEnvelope.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SaveStateEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SaveStateEnvelope;
  static deserializeBinaryFromReader(message: SaveStateEnvelope, reader: jspb.BinaryReader): SaveStateEnvelope;
}

export namespace SaveStateEnvelope {
  export type AsObject = {
    storename: string,
    requestsList: Array<StateRequest.AsObject>,
  }
}

export class GetStateEnvelope extends jspb.Message {
  getStorename(): string;
  setStorename(value: string): void;

  getKey(): string;
  setKey(value: string): void;

  getConsistency(): string;
  setConsistency(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetStateEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: GetStateEnvelope): GetStateEnvelope.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetStateEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetStateEnvelope;
  static deserializeBinaryFromReader(message: GetStateEnvelope, reader: jspb.BinaryReader): GetStateEnvelope;
}

export namespace GetStateEnvelope {
  export type AsObject = {
    storename: string,
    key: string,
    consistency: string,
  }
}

export class GetStateResponseEnvelope extends jspb.Message {
  hasData(): boolean;
  clearData(): void;
  getData(): google_protobuf_any_pb.Any | undefined;
  setData(value?: google_protobuf_any_pb.Any): void;

  getEtag(): string;
  setEtag(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetStateResponseEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: GetStateResponseEnvelope): GetStateResponseEnvelope.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
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

export class InvokeBindingEnvelope extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  hasData(): boolean;
  clearData(): void;
  getData(): google_protobuf_any_pb.Any | undefined;
  setData(value?: google_protobuf_any_pb.Any): void;

  getMetadataMap(): jspb.Map<string, string>;
  clearMetadataMap(): void;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InvokeBindingEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: InvokeBindingEnvelope): InvokeBindingEnvelope.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
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

export class InvokeServiceEnvelope extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getMethod(): string;
  setMethod(value: string): void;

  hasData(): boolean;
  clearData(): void;
  getData(): google_protobuf_any_pb.Any | undefined;
  setData(value?: google_protobuf_any_pb.Any): void;

  getMetadataMap(): jspb.Map<string, string>;
  clearMetadataMap(): void;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InvokeServiceEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: InvokeServiceEnvelope): InvokeServiceEnvelope.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: InvokeServiceEnvelope, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InvokeServiceEnvelope;
  static deserializeBinaryFromReader(message: InvokeServiceEnvelope, reader: jspb.BinaryReader): InvokeServiceEnvelope;
}

export namespace InvokeServiceEnvelope {
  export type AsObject = {
    id: string,
    method: string,
    data?: google_protobuf_any_pb.Any.AsObject,
    metadataMap: Array<[string, string]>,
  }
}

export class PublishEventEnvelope extends jspb.Message {
  getTopic(): string;
  setTopic(value: string): void;

  hasData(): boolean;
  clearData(): void;
  getData(): google_protobuf_any_pb.Any | undefined;
  setData(value?: google_protobuf_any_pb.Any): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PublishEventEnvelope.AsObject;
  static toObject(includeInstance: boolean, msg: PublishEventEnvelope): PublishEventEnvelope.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
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

  hasValue(): boolean;
  clearValue(): void;
  getValue(): google_protobuf_any_pb.Any | undefined;
  setValue(value?: google_protobuf_any_pb.Any): void;

  getEtag(): string;
  setEtag(value: string): void;

  getMetadataMap(): jspb.Map<string, string>;
  clearMetadataMap(): void;
  hasOptions(): boolean;
  clearOptions(): void;
  getOptions(): StateOptions | undefined;
  setOptions(value?: StateOptions): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): State.AsObject;
  static toObject(includeInstance: boolean, msg: State): State.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
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

  hasRetrypolicy(): boolean;
  clearRetrypolicy(): void;
  getRetrypolicy(): RetryPolicy | undefined;
  setRetrypolicy(value?: RetryPolicy): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StateOptions.AsObject;
  static toObject(includeInstance: boolean, msg: StateOptions): StateOptions.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: StateOptions, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StateOptions;
  static deserializeBinaryFromReader(message: StateOptions, reader: jspb.BinaryReader): StateOptions;
}

export namespace StateOptions {
  export type AsObject = {
    concurrency: string,
    consistency: string,
    retrypolicy?: RetryPolicy.AsObject,
  }
}

export class RetryPolicy extends jspb.Message {
  getThreshold(): number;
  setThreshold(value: number): void;

  getPattern(): string;
  setPattern(value: string): void;

  hasInterval(): boolean;
  clearInterval(): void;
  getInterval(): google_protobuf_duration_pb.Duration | undefined;
  setInterval(value?: google_protobuf_duration_pb.Duration): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RetryPolicy.AsObject;
  static toObject(includeInstance: boolean, msg: RetryPolicy): RetryPolicy.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
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

  hasValue(): boolean;
  clearValue(): void;
  getValue(): google_protobuf_any_pb.Any | undefined;
  setValue(value?: google_protobuf_any_pb.Any): void;

  getEtag(): string;
  setEtag(value: string): void;

  getMetadataMap(): jspb.Map<string, string>;
  clearMetadataMap(): void;
  hasOptions(): boolean;
  clearOptions(): void;
  getOptions(): StateRequestOptions | undefined;
  setOptions(value?: StateRequestOptions): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StateRequest.AsObject;
  static toObject(includeInstance: boolean, msg: StateRequest): StateRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
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
    options?: StateRequestOptions.AsObject,
  }
}

export class StateRequestOptions extends jspb.Message {
  getConcurrency(): string;
  setConcurrency(value: string): void;

  getConsistency(): string;
  setConsistency(value: string): void;

  hasRetrypolicy(): boolean;
  clearRetrypolicy(): void;
  getRetrypolicy(): StateRetryPolicy | undefined;
  setRetrypolicy(value?: StateRetryPolicy): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StateRequestOptions.AsObject;
  static toObject(includeInstance: boolean, msg: StateRequestOptions): StateRequestOptions.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: StateRequestOptions, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StateRequestOptions;
  static deserializeBinaryFromReader(message: StateRequestOptions, reader: jspb.BinaryReader): StateRequestOptions;
}

export namespace StateRequestOptions {
  export type AsObject = {
    concurrency: string,
    consistency: string,
    retrypolicy?: StateRetryPolicy.AsObject,
  }
}

export class StateRetryPolicy extends jspb.Message {
  getThreshold(): number;
  setThreshold(value: number): void;

  getPattern(): string;
  setPattern(value: string): void;

  hasInterval(): boolean;
  clearInterval(): void;
  getInterval(): google_protobuf_duration_pb.Duration | undefined;
  setInterval(value?: google_protobuf_duration_pb.Duration): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StateRetryPolicy.AsObject;
  static toObject(includeInstance: boolean, msg: StateRetryPolicy): StateRetryPolicy.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: StateRetryPolicy, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StateRetryPolicy;
  static deserializeBinaryFromReader(message: StateRetryPolicy, reader: jspb.BinaryReader): StateRetryPolicy;
}

export namespace StateRetryPolicy {
  export type AsObject = {
    threshold: number,
    pattern: string,
    interval?: google_protobuf_duration_pb.Duration.AsObject,
  }
}

