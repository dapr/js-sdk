import { DaprClient } from "../../../src";

const host = "127.0.0.1";
const port = "50001";

describe('DaprClient', () => {
  it('should allow us to create a DaprClient', () => {
    const client = new DaprClient(host, port);
    expect(client.getDaprHost()).toEqual(host);
    expect(client.getDaprPort()).toEqual(port);
  });

  it('should throw an error on a wrong port', () => {
    try {
      const client = new DaprClient(host, host);
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toEqual("DAPR_CLIENT_INCORRECT_PORT");
    }
  });
});
