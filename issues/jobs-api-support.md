---
name: Feature Request
about: Implement Jobs API (Alpha1) support in the JavaScript SDK
title: "feat: Implement Jobs API support (ScheduleJob / GetJob / DeleteJob / ListJobs)"
labels: kind/enhancement
assignees: ""
---

## Feature Request

### Describe the feature

The Dapr runtime exposes a **Jobs API** (currently Alpha1) that enables applications to
schedule, retrieve, delete, and list jobs — as well as receive triggered job events via
an app callback. The JS SDK already has the generated proto/ConnectRPC bindings and a
no-op server stub for `onJobEventAlpha1`, but **no high-level client or server API** is
exposed to users.

This issue tracks the work required to add first-class Jobs support to the JS SDK.

---

### Dapr Jobs API surface (proto RPCs)

From `src/proto/dapr/proto/runtime/v1/dapr.proto`:

````proto
service Dapr {
  // Create and schedule a job
  rpc ScheduleJobAlpha1(ScheduleJobRequest) returns (ScheduleJobResponse) {}

  // Gets a scheduled job
  rpc GetJobAlpha1(GetJobRequest) returns (GetJobResponse) {}

  // Delete a job
  rpc DeleteJobAlpha1(DeleteJobRequest) returns (DeleteJobResponse) {}

  // Delete jobs by name prefix
  rpc DeleteJobsByPrefixAlpha1(DeleteJobsByPrefixRequestAlpha1) returns (DeleteJobsByPrefixResponseAlpha1) {}

  // List all jobs
  rpc ListJobsAlpha1(ListJobsRequestAlpha1) returns (ListJobsResponseAlpha1) {}
}
````

From `src/proto/dapr/proto/runtime/v1/appcallback.proto`:

````proto
service AppCallbackAlpha {
  // Sends job back to the app's endpoint at trigger time.
  rpc OnJobEventAlpha1 (JobEventRequest) returns (JobEventResponse);
}
````

---

### Job message definition

From `src/proto/dapr/proto/runtime/v1/jobs.proto`:

````proto
message Job {
  string name = 1;
  optional string schedule = 2;       // cron or @every/@daily/etc.
  optional uint32 repeats = 3;        // run N times (omit = indefinite)
  optional string due_time = 4;       // RFC3339, Go duration, or ISO8601
  optional string ttl = 5;            // expiration
  google.protobuf.Any data = 6;       // arbitrary payload
  optional common.v1.JobFailurePolicy failure_policy = 7;
}

message ScheduleJobRequest {
  Job job = 1;
  bool overwrite = 2;
}
message ScheduleJobResponse {}

message GetJobRequest { string name = 1; }
message GetJobResponse { Job job = 1; }

message DeleteJobRequest { string name = 1; }
message DeleteJobResponse {}

message DeleteJobsByPrefixRequestAlpha1 { optional string name_prefix = 1; }
message DeleteJobsByPrefixResponseAlpha1 {}

message ListJobsRequestAlpha1 {}
message ListJobsResponseAlpha1 { repeated Job jobs = 1; }
````

Failure policy (from `src/proto/dapr/proto/common/v1/common.proto`):

````proto
message JobFailurePolicy {
  oneof policy {
    JobFailurePolicyDrop drop = 1;
    JobFailurePolicyConstant constant = 2;
  }
}
message JobFailurePolicyDrop {}
message JobFailurePolicyConstant {
  google.protobuf.Duration interval = 1;
  optional uint32 max_retries = 2;
}
````

---

### Current state in the JS SDK

| Area | Status |
|------|--------|
| Proto definitions (`src/proto/dapr/proto/runtime/v1/jobs.proto`) | ✅ Present |
| ConnectRPC bindings (`dapr_connect.{js,d.ts}`) | ✅ Generated |
| Server stub `onJobEventAlpha1` in `GRPCServerImpl.ts` | ⚠️ No-op (returns empty response) |
| Client interface for Jobs | ❌ Missing |
| Client implementation (gRPC) | ❌ Missing |
| Client implementation (HTTP) | ❌ Missing |
| User-facing TypeScript types | ❌ Missing |
| Job event handler registration on `DaprServer` | ❌ Missing |
| Tests | ❌ Missing |
| Exports from package index | ❌ Missing |

---

### Proposed implementation scope

#### 1. User-facing types (`src/types/jobs/`)

````typescript
export interface DaprJob {
  name: string;
  schedule?: string;
  repeats?: number;
  dueTime?: string;
  ttl?: string;
  data?: unknown;
  failurePolicy?: JobFailurePolicy;
}

export type JobFailurePolicy =
  | { type: "drop" }
  | { type: "constant"; interval: string; maxRetries?: number };

export interface ScheduleJobOptions {
  job: DaprJob;
  overwrite?: boolean;
}
````

#### 2. Client interface (`src/interfaces/Client/IClientJobs.ts`)

````typescript
export interface IClientJobs {
  schedule(options: ScheduleJobOptions): Promise<void>;
  get(name: string): Promise<DaprJob>;
  delete(name: string): Promise<void>;
  deleteByPrefix(namePrefix?: string): Promise<void>;
  list(): Promise<DaprJob[]>;
}
````

#### 3. gRPC client implementation (`src/implementation/Client/GRPCClient/jobs.ts`)

Map user-facing types ↔ proto schemas and call:
- `client.scheduleJobAlpha1()`
- `client.getJobAlpha1()`
- `client.deleteJobAlpha1()`
- `client.deleteJobsByPrefixAlpha1()`
- `client.listJobsAlpha1()`

Handle `google.protobuf.Any` serialization for `data` transparently.

#### 4. HTTP client implementation (`src/implementation/Client/HTTPClient/jobs.ts`)

Endpoints:
- `POST /v1.0-alpha1/jobs/<name>` — schedule
- `GET /v1.0-alpha1/jobs/<name>` — get
- `DELETE /v1.0-alpha1/jobs/<name>` — delete

#### 5. DaprClient integration

Expose a `jobs` property on `DaprClient`:

````typescript
const client = new DaprClient();
await client.jobs.schedule({ job: { name: "my-job", schedule: "@every 5m" } });
const job = await client.jobs.get("my-job");
const all = await client.jobs.list();
await client.jobs.delete("my-job");
await client.jobs.deleteByPrefix("my-");
````

#### 6. Server-side: job handler registration

Allow registering named handlers on `DaprServer`:

````typescript
const server = new DaprServer();

server.jobs.on("send-reminder", async (event) => {
  const payload = event.data;
  console.log("Triggered:", payload);
});

await server.start();
````

#### 7. Implement `onJobEventAlpha1` routing

Update `GRPCServerImpl.ts` to route incoming `JobEventRequest` messages to the
appropriate registered handler by job name.

#### 8. Exports

Export all new types and interfaces from `src/index.ts`.

#### 9. Tests

- Unit tests for type ↔ proto mapping (both directions)
- E2E test with a scheduler component if testcontainers supports it

---

### Target usage examples

**Scheduling a job:**

````typescript
import { DaprClient } from "@dapr/dapr";

const client = new DaprClient();

await client.jobs.schedule({
  job: {
    name: "send-report",
    schedule: "0 0 9 * * *", // 9 AM daily
    data: { reportType: "weekly", recipients: ["team@example.com"] },
    failurePolicy: { type: "constant", interval: "30s", maxRetries: 3 },
  },
  overwrite: true,
});
````

**Receiving a triggered job:**

````typescript
import { DaprServer } from "@dapr/dapr";

const server = new DaprServer();

server.jobs.on("send-report", async (event) => {
  const { reportType, recipients } = event.data;
  await generateAndSendReport(reportType, recipients);
});

await server.start();
````

---

### References

| Resource | Location |
|----------|----------|
| Proto messages | `src/proto/dapr/proto/runtime/v1/jobs.proto` |
| Proto RPCs | `src/proto/dapr/proto/runtime/v1/dapr.proto:235-246` |
| App callback | `src/proto/dapr/proto/runtime/v1/appcallback.proto:70` |
| Failure policy | `src/proto/dapr/proto/common/v1/common.proto:163-178` |
| ConnectRPC bindings | `src/proto/dapr/proto/runtime/v1/dapr_connect.{js,d.ts}` |
| Existing server stub | `src/implementation/Server/GRPCServer/GRPCServerImpl.ts:396` |
| Dapr docs | https://docs.dapr.io/reference/api/jobs_api/ |

---

### Acceptance criteria

- [ ] `DaprClient` exposes `client.jobs` with `schedule()`, `get()`, `delete()`, `deleteByPrefix()`, `list()`
- [ ] Both gRPC and HTTP transports are implemented
- [ ] `DaprServer` supports registering job event handlers by name
- [ ] `onJobEventAlpha1` in `GRPCServerImpl` routes events to registered handlers
- [ ] All proto fields are represented in user-facing types (including `failure_policy`, `overwrite`, `data`)
- [ ] `google.protobuf.Any` payload is serialized/deserialized transparently
- [ ] Unit tests cover type mapping between user types and proto schemas
- [ ] New types/interfaces are exported from the package index
