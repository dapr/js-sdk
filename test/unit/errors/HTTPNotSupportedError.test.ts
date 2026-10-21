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

import { HTTPNotSupportedError } from "../../../src/errors/HTTPNotSupportedError";

describe("HTTPNotSupportedError", () => {
  it("creates an Error with the default message and name", () => {
    const error = new HTTPNotSupportedError();

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HTTPNotSupportedError);
    expect(error.name).toBe("HTTPNotSupportedError");
    expect(error.message).toBe("HTTP is currently not supported.");
    expect(error.toString()).toBe("HTTPNotSupportedError: HTTP is currently not supported.");
  });

  it("preserves a custom message and the error identity", () => {
    const error = new HTTPNotSupportedError("Streaming pub/sub subscriptions require the gRPC protocol.");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HTTPNotSupportedError);
    expect(error.name).toBe("HTTPNotSupportedError");
    expect(error.message).toBe("Streaming pub/sub subscriptions require the gRPC protocol.");
    expect(error.toString()).toBe("HTTPNotSupportedError: Streaming pub/sub subscriptions require the gRPC protocol.");
  });
});
