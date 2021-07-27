import HttpStatusCode from '../../enum/HttpStatusCode.enum';
import IServerBindingStrategy from '../IServerBindingStrategy';
import HTTPServer from './HTTPServer';

// https://docs.dapr.io/reference/api/bindings_api/
type FunctionDaprInputCallback = (data: any) => Promise<any>;

export default class DaprServerBinding implements IServerBindingStrategy {
  server: HTTPServer;

  constructor(server: HTTPServer) {
      this.server = server;
  }

  // Receive an input from an external system
  async receive(bindingName: string, cb: FunctionDaprInputCallback) {
    const server = await this.server.getServer();

    server.options(`/${bindingName}`, (req, res) => {
      return res.end();
    });

    server.post(`/${bindingName}`, async (req, res) => {
      req.setTimeout(60 * 1000); // amount of seconds to wait for the request CB to finalize

      try {
        await cb(req?.body);

        // we send the processing status after we are done processing
        // note: if the callback takes longer than the expected wait time in the queue, it might be that this never gets called
        // @todo: can we do this cleaner without sending the response directly?
        res.statusCode = HttpStatusCode.OK;
        return res.end();
      } catch (e) {
        res.statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;

        return res.end(JSON.stringify({
          error: "COULD_NOT_PROCESS_CALLBACK",
          error_msg: `Something happened while processing the input binding callback - ${e.message}`
        }));
      }
    });
  }
}
