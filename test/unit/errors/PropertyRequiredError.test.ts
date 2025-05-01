/*
Copyright 2023 The Dapr Authors
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

import { PropertyRequiredError } from "../../../src/errors/PropertyRequiredError";

describe("PropertyRequiredError_class", () => {
  // Tests that the constructor creates an instance of PropertyRequiredError
  it("should be an instance of PropertyRequiredError", () => {
    const error = new PropertyRequiredError("test");
    expect(error).toBeInstanceOf(PropertyRequiredError);
  });

  // Tests that the constructor sets the propertyName property correctly
  it("should set `propertyName` property correctly", () => {
    const propertyName = "test";
    const error = new PropertyRequiredError(propertyName);
    expect(error.propertyName).toBe(propertyName);
  });

  // Tests that the constructor sets the message property correctly
  it("should set `message` property correctly", () => {
    const propertyName = "test";
    const error = new PropertyRequiredError(propertyName);
    expect(error.message).toBe(`${propertyName} is required`);
  });

  // Tests that the constructor throws an error
  it("should throw an error if propertyName is an empty string", () => {
    expect(() => new PropertyRequiredError("")).toThrow();
  });
});
