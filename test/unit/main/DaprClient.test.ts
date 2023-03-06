/*
Copyright 2022 The Dapr Authors
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

import { CommunicationProtocolEnum, DaprClient } from "../../../src";

const host = "127.0.0.1";
const port = "50001";

describe("DaprClient", () => {
  it("should allow us to create a DaprClient", () => {
    const client = new DaprClient({ daprHost: host, daprPort: port });
    expect(client.options.daprHost).toEqual(host);
    expect(client.options.daprPort).toEqual(port);
  });

  it("should throw an error on a wrong port", () => {
    try {
      new DaprClient({ daprHost: host, daprPort: host });
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toEqual("DAPR_INCORRECT_SIDECAR_PORT");
    }
  });

  it("same http client should be returned for multiple DaprClient invocations", () => {
    const daprClient1 = new DaprClient({ daprHost: host, daprPort: port });
    const daprClient2 = new DaprClient({ daprHost: host, daprPort: port });
    return Promise.all([
      daprClient1.daprClient.getClient(false),
      daprClient2.daprClient.getClient(false),
    ]).then(function (values) {
      expect(values[0]).toEqual(values[1]);
    });
  });

  it("should return dapr api token", () => {
    const daprClient = new DaprClient({ daprHost: host, daprPort: port, communicationProtocol: CommunicationProtocolEnum.HTTP, daprApiToken: "test" });
    expect(daprClient.options.daprApiToken).toEqual("test");
  });
});
