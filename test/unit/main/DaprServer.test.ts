import { DaprServer } from "../../../src";

const host = "127.0.0.1";
const port = "50001";

describe('DaprServer', () => {
  it('should allow us to create a DaprServer', () => {
    const server = new DaprServer(host, port, host, port);
    expect(server.getDaprHost()).toEqual(host);
    expect(server.getDaprPort()).toEqual(port);
  });

  it('should throw an error on a wrong port for server', () => {
    try {
      new DaprServer(host, host);
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toEqual("DAPR_INCORRECT_SERVER_PORT");
    }
  });

  it('should throw an error on a wrong port for client', () => {
    try {
      new DaprServer(host, port, host, host);
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toEqual("DAPR_INCORRECT_SIDECAR_PORT");
    }
  });
});
