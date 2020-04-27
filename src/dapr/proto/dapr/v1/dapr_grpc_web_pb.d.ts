import * as grpcWeb from 'grpc-web';

import * as google_protobuf_any_pb from 'google-protobuf/google/protobuf/any_pb';
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as google_protobuf_duration_pb from 'google-protobuf/google/protobuf/duration_pb';
import * as dapr_proto_common_v1_common_pb from '../../../../dapr/proto/common/v1/common_pb';

import {
  DeleteStateEnvelope,
  GetSecretEnvelope,
  GetSecretResponseEnvelope,
  GetStateEnvelope,
  GetStateResponseEnvelope,
  InvokeBindingEnvelope,
  InvokeServiceRequest,
  PublishEventEnvelope,
  SaveStateEnvelope} from './dapr_pb';

export class DaprClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

  publishEvent(
    request: PublishEventEnvelope,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  invokeService(
    request: InvokeServiceRequest,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: dapr_proto_common_v1_common_pb.InvokeResponse) => void
  ): grpcWeb.ClientReadableStream<dapr_proto_common_v1_common_pb.InvokeResponse>;

  invokeBinding(
    request: InvokeBindingEnvelope,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  getState(
    request: GetStateEnvelope,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: GetStateResponseEnvelope) => void
  ): grpcWeb.ClientReadableStream<GetStateResponseEnvelope>;

  getSecret(
    request: GetSecretEnvelope,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: GetSecretResponseEnvelope) => void
  ): grpcWeb.ClientReadableStream<GetSecretResponseEnvelope>;

  saveState(
    request: SaveStateEnvelope,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  deleteState(
    request: DeleteStateEnvelope,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

}

export class DaprPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

  publishEvent(
    request: PublishEventEnvelope,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  invokeService(
    request: InvokeServiceRequest,
    metadata?: grpcWeb.Metadata
  ): Promise<dapr_proto_common_v1_common_pb.InvokeResponse>;

  invokeBinding(
    request: InvokeBindingEnvelope,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  getState(
    request: GetStateEnvelope,
    metadata?: grpcWeb.Metadata
  ): Promise<GetStateResponseEnvelope>;

  getSecret(
    request: GetSecretEnvelope,
    metadata?: grpcWeb.Metadata
  ): Promise<GetSecretResponseEnvelope>;

  saveState(
    request: SaveStateEnvelope,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  deleteState(
    request: DeleteStateEnvelope,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

}

