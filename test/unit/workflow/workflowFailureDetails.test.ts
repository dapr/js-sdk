/*
Copyright 2024 The Dapr Authors
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

import { WorkflowFailureDetails } from "../../../src";
import { create } from "@bufbuild/protobuf";
import { TaskFailureDetailsSchema } from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import { TaskFailedError } from "../../../src/workflow/engine";
import { newFailureDetails } from "../../../src/workflow/engine/worker/protoHelpers";

describe("WorkflowFailureDetails", () => {
  it("recursively wraps nested failures while preserving the raw protobuf API", () => {
    const raw = create(TaskFailureDetailsSchema, {
      errorType: "ParentError",
      errorMessage: "parent",
      innerFailure: {
        errorType: "ChildError",
        errorMessage: "child",
        stackTrace: "child stack",
        innerFailure: {
          errorType: "RootError",
          errorMessage: "root",
          isNonRetriable: true,
        },
      },
    });
    const details = new WorkflowFailureDetails(raw);
    const child = details.getInnerFailure()!;
    const root = child.getInnerFailure()!;
    expect(child).toBeInstanceOf(WorkflowFailureDetails);
    expect(child.getErrorType()).toBe("ChildError");
    expect(child.getErrorMessage()).toBe("child");
    expect(child.getStackTrace()).toBe("child stack");
    expect(child.isNonRetriable).toBe(false);
    expect(root).toBeInstanceOf(WorkflowFailureDetails);
    expect(root.getErrorType()).toBe("RootError");
    expect(root.getErrorMessage()).toBe("root");
    expect(root.isNonRetriable).toBe(true);
    expect(root.getInnerFailure()).toBeUndefined();
    expect(details.innerFailure).toBe(raw.innerFailure);
    expect(child.innerFailure).toBe(raw.innerFailure?.innerFailure);
  });

  it("preserves task failure chains when a failed activity or child fails its caller", () => {
    const raw = create(TaskFailureDetailsSchema, {
      errorType: "TypeError",
      errorMessage: "original error",
      stackTrace: "original stack",
      isNonRetriable: true,
    });
    const error = TaskFailedError.fromFailureDetails("activity failed", raw);
    const child = newFailureDetails(error);
    const parent = newFailureDetails(TaskFailedError.fromFailureDetails("child failed", child));
    const root = new WorkflowFailureDetails(parent).getInnerFailure()!.getInnerFailure()!;
    expect(root.getErrorMessage()).toBe("original error");
    expect(root.getStackTrace()).toBe("original stack");
    expect(root.isNonRetriable).toBe(true);
    expect(error.details).toEqual({
      message: "activity failed",
      errorType: "TypeError",
      stackTrace: "original stack",
    });
    expect(new WorkflowFailureDetails(newFailureDetails(new Error("plain"))).getInnerFailure()).toBeUndefined();
    expect(newFailureDetails(new TaskFailedError("legacy", "Error")).innerFailure).toBeUndefined();
  });

  describe("getErrorType", () => {
    it("should return the error type", () => {
      const mockFailureDetails = {
        errorType: "TypeError",
        errorMessage: "Something went wrong",
        stackTrace: "at line 1",
      };

      const details = new WorkflowFailureDetails(mockFailureDetails as any);
      expect(details.getErrorType()).toBe("TypeError");
    });
  });

  describe("getErrorMessage", () => {
    it("should return the error message", () => {
      const mockFailureDetails = {
        errorType: "Error",
        errorMessage: "Connection refused",
        stackTrace: undefined,
      };

      const details = new WorkflowFailureDetails(mockFailureDetails as any);
      expect(details.getErrorMessage()).toBe("Connection refused");
    });
  });

  describe("getStackTrace", () => {
    it("should return the stack trace when available", () => {
      const stackTrace = "Error: test\n    at Object.<anonymous> (test.ts:1:1)";
      const mockFailureDetails = {
        errorType: "Error",
        errorMessage: "test",
        stackTrace: stackTrace,
      };

      const details = new WorkflowFailureDetails(mockFailureDetails as any);
      expect(details.getStackTrace()).toBe(stackTrace);
    });

    it("should return undefined when stack trace is not available", () => {
      const mockFailureDetails = {
        errorType: "Error",
        errorMessage: "test",
        stackTrace: undefined,
      };

      const details = new WorkflowFailureDetails(mockFailureDetails as any);
      expect(details.getStackTrace()).toBeUndefined();
    });
  });
});
