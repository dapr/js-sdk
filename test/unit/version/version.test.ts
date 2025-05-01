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

import packageJson from "../../../package.json";
import packageLockJson from "../../../package-lock.json";
describe("versions", () => {
  it("should have the same JS-SDK version in package.json and package-lock.json", () => {
    const sdkVersionInPackageJSon = packageJson.version;
    const sdkVersionInPackageLockJSon = packageLockJson.version;
    expect(sdkVersionInPackageJSon).toEqual(sdkVersionInPackageLockJSon);
  });
});
