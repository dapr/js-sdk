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

import { WorkflowFailureDetails } from "../../../src/workflow/client/WorkflowFailureDetails";

describe("WorkflowFailureDetails", () => {
  describe("getErrorType", () => {
    it("should return the error type", () => {
      const mockFailureDetails = {
        errorType: "TypeError",
        message: "Something went wrong",
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
        message: "Connection refused",
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
        message: "test",
        stackTrace: stackTrace,
      };

      const details = new WorkflowFailureDetails(mockFailureDetails as any);
      expect(details.getStackTrace()).toBe(stackTrace);
    });

    it("should return undefined when stack trace is not available", () => {
      const mockFailureDetails = {
        errorType: "Error",
        message: "test",
        stackTrace: undefined,
      };

      const details = new WorkflowFailureDetails(mockFailureDetails as any);
      expect(details.getStackTrace()).toBeUndefined();
    });
  });
});
