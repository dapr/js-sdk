// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var dapr_proto_scheduler_v1_scheduler_pb = require('../../../../dapr/proto/scheduler/v1/scheduler_pb.js');
var dapr_proto_common_v1_common_pb = require('../../../../dapr/proto/common/v1/common_pb.js');
var google_protobuf_any_pb = require('google-protobuf/google/protobuf/any_pb.js');

function serialize_dapr_proto_scheduler_v1_DeleteByMetadataRequest(arg) {
  if (!(arg instanceof dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataRequest)) {
    throw new Error('Expected argument of type dapr.proto.scheduler.v1.DeleteByMetadataRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_scheduler_v1_DeleteByMetadataRequest(buffer_arg) {
  return dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_scheduler_v1_DeleteByMetadataResponse(arg) {
  if (!(arg instanceof dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataResponse)) {
    throw new Error('Expected argument of type dapr.proto.scheduler.v1.DeleteByMetadataResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_scheduler_v1_DeleteByMetadataResponse(buffer_arg) {
  return dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_scheduler_v1_DeleteByNamePrefixRequest(arg) {
  if (!(arg instanceof dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixRequest)) {
    throw new Error('Expected argument of type dapr.proto.scheduler.v1.DeleteByNamePrefixRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_scheduler_v1_DeleteByNamePrefixRequest(buffer_arg) {
  return dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_scheduler_v1_DeleteByNamePrefixResponse(arg) {
  if (!(arg instanceof dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixResponse)) {
    throw new Error('Expected argument of type dapr.proto.scheduler.v1.DeleteByNamePrefixResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_scheduler_v1_DeleteByNamePrefixResponse(buffer_arg) {
  return dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_scheduler_v1_DeleteJobRequest(arg) {
  if (!(arg instanceof dapr_proto_scheduler_v1_scheduler_pb.DeleteJobRequest)) {
    throw new Error('Expected argument of type dapr.proto.scheduler.v1.DeleteJobRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_scheduler_v1_DeleteJobRequest(buffer_arg) {
  return dapr_proto_scheduler_v1_scheduler_pb.DeleteJobRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_scheduler_v1_DeleteJobResponse(arg) {
  if (!(arg instanceof dapr_proto_scheduler_v1_scheduler_pb.DeleteJobResponse)) {
    throw new Error('Expected argument of type dapr.proto.scheduler.v1.DeleteJobResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_scheduler_v1_DeleteJobResponse(buffer_arg) {
  return dapr_proto_scheduler_v1_scheduler_pb.DeleteJobResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_scheduler_v1_GetJobRequest(arg) {
  if (!(arg instanceof dapr_proto_scheduler_v1_scheduler_pb.GetJobRequest)) {
    throw new Error('Expected argument of type dapr.proto.scheduler.v1.GetJobRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_scheduler_v1_GetJobRequest(buffer_arg) {
  return dapr_proto_scheduler_v1_scheduler_pb.GetJobRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_scheduler_v1_GetJobResponse(arg) {
  if (!(arg instanceof dapr_proto_scheduler_v1_scheduler_pb.GetJobResponse)) {
    throw new Error('Expected argument of type dapr.proto.scheduler.v1.GetJobResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_scheduler_v1_GetJobResponse(buffer_arg) {
  return dapr_proto_scheduler_v1_scheduler_pb.GetJobResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_scheduler_v1_ListJobsRequest(arg) {
  if (!(arg instanceof dapr_proto_scheduler_v1_scheduler_pb.ListJobsRequest)) {
    throw new Error('Expected argument of type dapr.proto.scheduler.v1.ListJobsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_scheduler_v1_ListJobsRequest(buffer_arg) {
  return dapr_proto_scheduler_v1_scheduler_pb.ListJobsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_scheduler_v1_ListJobsResponse(arg) {
  if (!(arg instanceof dapr_proto_scheduler_v1_scheduler_pb.ListJobsResponse)) {
    throw new Error('Expected argument of type dapr.proto.scheduler.v1.ListJobsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_scheduler_v1_ListJobsResponse(buffer_arg) {
  return dapr_proto_scheduler_v1_scheduler_pb.ListJobsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_scheduler_v1_ScheduleJobRequest(arg) {
  if (!(arg instanceof dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobRequest)) {
    throw new Error('Expected argument of type dapr.proto.scheduler.v1.ScheduleJobRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_scheduler_v1_ScheduleJobRequest(buffer_arg) {
  return dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_scheduler_v1_ScheduleJobResponse(arg) {
  if (!(arg instanceof dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobResponse)) {
    throw new Error('Expected argument of type dapr.proto.scheduler.v1.ScheduleJobResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_scheduler_v1_ScheduleJobResponse(buffer_arg) {
  return dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_scheduler_v1_WatchHostsRequest(arg) {
  if (!(arg instanceof dapr_proto_scheduler_v1_scheduler_pb.WatchHostsRequest)) {
    throw new Error('Expected argument of type dapr.proto.scheduler.v1.WatchHostsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_scheduler_v1_WatchHostsRequest(buffer_arg) {
  return dapr_proto_scheduler_v1_scheduler_pb.WatchHostsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_scheduler_v1_WatchHostsResponse(arg) {
  if (!(arg instanceof dapr_proto_scheduler_v1_scheduler_pb.WatchHostsResponse)) {
    throw new Error('Expected argument of type dapr.proto.scheduler.v1.WatchHostsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_scheduler_v1_WatchHostsResponse(buffer_arg) {
  return dapr_proto_scheduler_v1_scheduler_pb.WatchHostsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_scheduler_v1_WatchJobsRequest(arg) {
  if (!(arg instanceof dapr_proto_scheduler_v1_scheduler_pb.WatchJobsRequest)) {
    throw new Error('Expected argument of type dapr.proto.scheduler.v1.WatchJobsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_scheduler_v1_WatchJobsRequest(buffer_arg) {
  return dapr_proto_scheduler_v1_scheduler_pb.WatchJobsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_scheduler_v1_WatchJobsResponse(arg) {
  if (!(arg instanceof dapr_proto_scheduler_v1_scheduler_pb.WatchJobsResponse)) {
    throw new Error('Expected argument of type dapr.proto.scheduler.v1.WatchJobsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_scheduler_v1_WatchJobsResponse(buffer_arg) {
  return dapr_proto_scheduler_v1_scheduler_pb.WatchJobsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var SchedulerService = exports.SchedulerService = {
  // ScheduleJob is used by the daprd sidecar to schedule a job.
scheduleJob: {
    path: '/dapr.proto.scheduler.v1.Scheduler/ScheduleJob',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobRequest,
    responseType: dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobResponse,
    requestSerialize: serialize_dapr_proto_scheduler_v1_ScheduleJobRequest,
    requestDeserialize: deserialize_dapr_proto_scheduler_v1_ScheduleJobRequest,
    responseSerialize: serialize_dapr_proto_scheduler_v1_ScheduleJobResponse,
    responseDeserialize: deserialize_dapr_proto_scheduler_v1_ScheduleJobResponse,
  },
  // Get a job
getJob: {
    path: '/dapr.proto.scheduler.v1.Scheduler/GetJob',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_scheduler_v1_scheduler_pb.GetJobRequest,
    responseType: dapr_proto_scheduler_v1_scheduler_pb.GetJobResponse,
    requestSerialize: serialize_dapr_proto_scheduler_v1_GetJobRequest,
    requestDeserialize: deserialize_dapr_proto_scheduler_v1_GetJobRequest,
    responseSerialize: serialize_dapr_proto_scheduler_v1_GetJobResponse,
    responseDeserialize: deserialize_dapr_proto_scheduler_v1_GetJobResponse,
  },
  // DeleteJob is used by the daprd sidecar to delete a job.
deleteJob: {
    path: '/dapr.proto.scheduler.v1.Scheduler/DeleteJob',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_scheduler_v1_scheduler_pb.DeleteJobRequest,
    responseType: dapr_proto_scheduler_v1_scheduler_pb.DeleteJobResponse,
    requestSerialize: serialize_dapr_proto_scheduler_v1_DeleteJobRequest,
    requestDeserialize: deserialize_dapr_proto_scheduler_v1_DeleteJobRequest,
    responseSerialize: serialize_dapr_proto_scheduler_v1_DeleteJobResponse,
    responseDeserialize: deserialize_dapr_proto_scheduler_v1_DeleteJobResponse,
  },
  // WatchJobs is used by the daprd sidecar to connect to the Scheduler
// service to watch for jobs triggering back.
watchJobs: {
    path: '/dapr.proto.scheduler.v1.Scheduler/WatchJobs',
    requestStream: true,
    responseStream: true,
    requestType: dapr_proto_scheduler_v1_scheduler_pb.WatchJobsRequest,
    responseType: dapr_proto_scheduler_v1_scheduler_pb.WatchJobsResponse,
    requestSerialize: serialize_dapr_proto_scheduler_v1_WatchJobsRequest,
    requestDeserialize: deserialize_dapr_proto_scheduler_v1_WatchJobsRequest,
    responseSerialize: serialize_dapr_proto_scheduler_v1_WatchJobsResponse,
    responseDeserialize: deserialize_dapr_proto_scheduler_v1_WatchJobsResponse,
  },
  // ListJobs is used by the daprd sidecar to list all jobs.
listJobs: {
    path: '/dapr.proto.scheduler.v1.Scheduler/ListJobs',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_scheduler_v1_scheduler_pb.ListJobsRequest,
    responseType: dapr_proto_scheduler_v1_scheduler_pb.ListJobsResponse,
    requestSerialize: serialize_dapr_proto_scheduler_v1_ListJobsRequest,
    requestDeserialize: deserialize_dapr_proto_scheduler_v1_ListJobsRequest,
    responseSerialize: serialize_dapr_proto_scheduler_v1_ListJobsResponse,
    responseDeserialize: deserialize_dapr_proto_scheduler_v1_ListJobsResponse,
  },
  // WatchHosts is used by the daprd sidecar to retrieve the list of active
// scheduler hosts so that it can connect to each. Receives an updated list
// on leadership changes.
watchHosts: {
    path: '/dapr.proto.scheduler.v1.Scheduler/WatchHosts',
    requestStream: false,
    responseStream: true,
    requestType: dapr_proto_scheduler_v1_scheduler_pb.WatchHostsRequest,
    responseType: dapr_proto_scheduler_v1_scheduler_pb.WatchHostsResponse,
    requestSerialize: serialize_dapr_proto_scheduler_v1_WatchHostsRequest,
    requestDeserialize: deserialize_dapr_proto_scheduler_v1_WatchHostsRequest,
    responseSerialize: serialize_dapr_proto_scheduler_v1_WatchHostsResponse,
    responseDeserialize: deserialize_dapr_proto_scheduler_v1_WatchHostsResponse,
  },
  // DeleteByMetadata is used by the daprd sidecar to delete jobs by a metadata
// target.
deleteByMetadata: {
    path: '/dapr.proto.scheduler.v1.Scheduler/DeleteByMetadata',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataRequest,
    responseType: dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataResponse,
    requestSerialize: serialize_dapr_proto_scheduler_v1_DeleteByMetadataRequest,
    requestDeserialize: deserialize_dapr_proto_scheduler_v1_DeleteByMetadataRequest,
    responseSerialize: serialize_dapr_proto_scheduler_v1_DeleteByMetadataResponse,
    responseDeserialize: deserialize_dapr_proto_scheduler_v1_DeleteByMetadataResponse,
  },
  // DeleteByNamePrefix is used by the daprd sidecar to delete jobs by name
// prefix. An empty prefix deletes all jobs from the target.
deleteByNamePrefix: {
    path: '/dapr.proto.scheduler.v1.Scheduler/DeleteByNamePrefix',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixRequest,
    responseType: dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixResponse,
    requestSerialize: serialize_dapr_proto_scheduler_v1_DeleteByNamePrefixRequest,
    requestDeserialize: deserialize_dapr_proto_scheduler_v1_DeleteByNamePrefixRequest,
    responseSerialize: serialize_dapr_proto_scheduler_v1_DeleteByNamePrefixResponse,
    responseDeserialize: deserialize_dapr_proto_scheduler_v1_DeleteByNamePrefixResponse,
  },
};

exports.SchedulerClient = grpc.makeGenericClientConstructor(SchedulerService, 'Scheduler');
