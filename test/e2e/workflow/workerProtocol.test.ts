/*
Copyright 2026 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { createServer, type ServerHttp2Session } from "node:http2";
import { create } from "@bufbuild/protobuf";
import { connectNodeAdapter } from "@connectrpc/connect-node";
import WorkflowRuntime from "../../../src/workflow/runtime/WorkflowRuntime";
import {
  TaskHubSidecarService,
  WorkItemSchema,
  type WorkflowResponse,
} from "../../../src/proto/dapr/proto/durabletask/v1/orchestrator_service_pb";
import { HistoryEventSchema } from "../../../src/proto/dapr/proto/durabletask/v1/history_events_pb";
import { OrchestrationStatus } from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import { newEventRaisedEvent, newExecutionStartedEvent } from "../../../src/workflow/engine/worker/protoHelpers";

// Exercise the real HTTP/2 transport independently of sidecars that reject outbound eventSent messages.
describe("workflow worker gRPC protocol", () => {
  it.each(["return", "continue", "wait"])(
    "transmits a pending send on %s and does not resend after a history acknowledgment",
    async (mode) => {
      const responses: WorkflowResponse[] = [];
      let firstCompleted!: () => void;
      let replayCompleted!: () => void;
      const first = new Promise<void>((resolve) => {
        firstCompleted = resolve;
      });
      const replay = new Promise<void>((resolve) => {
        replayCompleted = resolve;
      });
      const start = newExecutionStartedEvent("sender", "sender-id");
      const sessions = new Set<ServerHttp2Session>();
      const server = createServer(
        connectNodeAdapter({
          routes(router) {
            router.service(TaskHubSidecarService, {
              hello: () => ({}),
              async *getWorkItems(_request, context) {
                yield create(WorkItemSchema, {
                  completionToken: "initial",
                  request: { case: "workflowRequest", value: { instanceId: "sender-id", newEvents: [start] } },
                });
                await first;
                yield create(WorkItemSchema, {
                  completionToken: "replay",
                  request: {
                    case: "workflowRequest",
                    value: {
                      instanceId: "sender-id",
                      pastEvents: [
                        start,
                        create(HistoryEventSchema, {
                          eventId: 1,
                          eventType: {
                            case: "eventSent",
                            value: { instanceId: "recipient", name: "message", input: '{"value":42}' },
                          },
                        }),
                      ],
                      newEvents: [newEventRaisedEvent("resume")],
                    },
                  },
                });
                await new Promise<void>((resolve) => {
                  if (context.signal.aborted) resolve();
                  else context.signal.addEventListener("abort", () => resolve(), { once: true });
                });
              },
              completeOrchestratorTask(request) {
                responses.push(request);
                if (responses.length === 1) firstCompleted();
                else replayCompleted();
                return {};
              },
            });
          },
        }),
      );
      server.on("session", (session) => {
        sessions.add(session);
        session.once("close", () => sessions.delete(session));
      });
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Expected a TCP listener");
      const runtime = new WorkflowRuntime({ daprHost: "127.0.0.1", daprPort: String(address.port) });
      runtime.registerWorkflowByName("sender", function* (ctx) {
        ctx.sendEvent("recipient", "message", { value: 42 });
        if (mode === "continue") ctx.continueAsNew({ next: true });
        if (mode === "wait") yield ctx.waitForExternalEvent("resume");
        return { sent: true };
      });
      let started = false;
      try {
        await runtime.start();
        started = true;
        await replay;
        expect(responses).toHaveLength(2);
        expect(responses[0].completionToken).toBe("initial");
        expect(responses[0].actions.map((action) => action.workflowActionType.case)).toEqual(
          mode === "wait" ? ["sendEvent"] : ["sendEvent", "completeWorkflow"],
        );
        expect(responses[0].actions[0].workflowActionType.value).toMatchObject({
          instance: { instanceId: "recipient" },
          name: "message",
          data: '{"value":42}',
        });
        expect(responses[1].completionToken).toBe("replay");
        expect(responses[1].actions.map((action) => action.workflowActionType.case)).toEqual(["completeWorkflow"]);
        expect(responses[1].actions[0].workflowActionType.value).toMatchObject({
          workflowStatus: mode === "continue" ? OrchestrationStatus.CONTINUED_AS_NEW : OrchestrationStatus.COMPLETED,
        });
      } finally {
        firstCompleted();
        if (started) await runtime.stop();
        for (const session of sessions) session.destroy();
        await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
      }
    },
    15000,
  );
});
