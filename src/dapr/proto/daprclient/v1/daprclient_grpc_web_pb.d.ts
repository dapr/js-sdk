import * as grpcWeb from 'grpc-web';

import * as google_protobuf_any_pb from 'google-protobuf/google/protobuf/any_pb';
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as google_protobuf_duration_pb from 'google-protobuf/google/protobuf/duration_pb';
import * as dapr_proto_common_v1_common_pb from '../../../../dapr/proto/common/v1/common_pb';

import {
  BindingEventEnvelope,
  BindingResponseEnvelope,
  CloudEventEnvelope,
  GetBindingsSubscriptionsEnvelope,
  GetTopicSubscriptionsEnvelope} from './daprclient_pb';

export class DaprClientClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

  onInvoke(
    request: dapr_proto_common_v1_common_pb.InvokeRequest,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: dapr_proto_common_v1_common_pb.InvokeResponse) => void
  ): grpcWeb.ClientReadableStream<dapr_proto_common_v1_common_pb.InvokeResponse>;

  getTopicSubscriptions(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: GetTopicSubscriptionsEnvelope) => void
  ): grpcWeb.ClientReadableStream<GetTopicSubscriptionsEnvelope>;

  getBindingsSubscriptions(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: GetBindingsSubscriptionsEnvelope) => void
  ): grpcWeb.ClientReadableStream<GetBindingsSubscriptionsEnvelope>;

  onBindingEvent(
    request: BindingEventEnvelope,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: BindingResponseEnvelope) => void
  ): grpcWeb.ClientReadableStream<BindingResponseEnvelope>;

  onTopicEvent(
    request: CloudEventEnvelope,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

}

export class DaprClientPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

  onInvoke(
    request: dapr_proto_common_v1_common_pb.InvokeRequest,
    metadata?: grpcWeb.Metadata
  ): Promise<dapr_proto_common_v1_common_pb.InvokeResponse>;

  getTopicSubscriptions(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<GetTopicSubscriptionsEnvelope>;

  getBindingsSubscriptions(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<GetBindingsSubscriptionsEnvelope>;

  onBindingEvent(
    request: BindingEventEnvelope,
    metadata?: grpcWeb.Metadata
  ): Promise<BindingResponseEnvelope>;

  onTopicEvent(
    request: CloudEventEnvelope,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

}

