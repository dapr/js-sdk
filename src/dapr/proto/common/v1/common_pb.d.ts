// package: dapr.proto.common.v1
// file: dapr/proto/common/v1/common.proto

import * as jspb from "google-protobuf";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";

export class HTTPExtension extends jspb.Message {
  getVerb(): HTTPExtension.VerbMap[keyof HTTPExtension.VerbMap];
  setVerb(value: HTTPExtension.VerbMap[keyof HTTPExtension.VerbMap]): void;

  getQuerystringMap(): jspb.Map<string, string>;
  clearQuerystringMap(): void;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HTTPExtension.AsObject;
  static toObject(includeInstance: boolean, msg: HTTPExtension): HTTPExtension.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: HTTPExtension, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HTTPExtension;
  static deserializeBinaryFromReader(message: HTTPExtension, reader: jspb.BinaryReader): HTTPExtension;
}

export namespace HTTPExtension {
  export type AsObject = {
    verb: HTTPExtension.VerbMap[keyof HTTPExtension.VerbMap],
    querystringMap: Array<[string, string]>,
  }

  export interface VerbMap {
    NONE: 0;
    GET: 1;
    HEAD: 2;
    POST: 3;
    PUT: 4;
    DELETE: 5;
    CONNECT: 6;
    OPTIONS: 7;
    TRACE: 8;
  }

  export const Verb: VerbMap;
}

export class DataWithContentType extends jspb.Message {
  getContentType(): string;
  setContentType(value: string): void;

  getBody(): Uint8Array | string;
  getBody_asU8(): Uint8Array;
  getBody_asB64(): string;
  setBody(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DataWithContentType.AsObject;
  static toObject(includeInstance: boolean, msg: DataWithContentType): DataWithContentType.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DataWithContentType, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DataWithContentType;
  static deserializeBinaryFromReader(message: DataWithContentType, reader: jspb.BinaryReader): DataWithContentType;
}

export namespace DataWithContentType {
  export type AsObject = {
    contentType: string,
    body: Uint8Array | string,
  }
}

export class InvokeRequest extends jspb.Message {
  getMethod(): string;
  setMethod(value: string): void;

  hasData(): boolean;
  clearData(): void;
  getData(): google_protobuf_any_pb.Any | undefined;
  setData(value?: google_protobuf_any_pb.Any): void;

  hasHttpExtension(): boolean;
  clearHttpExtension(): void;
  getHttpExtension(): HTTPExtension | undefined;
  setHttpExtension(value?: HTTPExtension): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InvokeRequest.AsObject;
  static toObject(includeInstance: boolean, msg: InvokeRequest): InvokeRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: InvokeRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InvokeRequest;
  static deserializeBinaryFromReader(message: InvokeRequest, reader: jspb.BinaryReader): InvokeRequest;
}

export namespace InvokeRequest {
  export type AsObject = {
    method: string,
    data?: google_protobuf_any_pb.Any.AsObject,
    httpExtension?: HTTPExtension.AsObject,
  }
}

export class InvokeResponse extends jspb.Message {
  hasData(): boolean;
  clearData(): void;
  getData(): google_protobuf_any_pb.Any | undefined;
  setData(value?: google_protobuf_any_pb.Any): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InvokeResponse.AsObject;
  static toObject(includeInstance: boolean, msg: InvokeResponse): InvokeResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: InvokeResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InvokeResponse;
  static deserializeBinaryFromReader(message: InvokeResponse, reader: jspb.BinaryReader): InvokeResponse;
}

export namespace InvokeResponse {
  export type AsObject = {
    data?: google_protobuf_any_pb.Any.AsObject,
  }
}

