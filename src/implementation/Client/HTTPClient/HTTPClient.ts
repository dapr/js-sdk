import fetch from "node-fetch";
import { CommunicationProtocolEnum } from "../../..";
import IClient from "../../../interfaces/Client/IClient";

export default class HTTPClient implements IClient {
  private readonly isInitialized: boolean;
  private readonly client: typeof fetch;
  private readonly clientHost: string;
  private readonly clientPort: string;
  private readonly clientUrl: string;

  constructor(host: string = "127.0.0.1", port: string = "50050") {
    this.isInitialized = true;
    this.clientHost = host;
    this.clientPort = port;

    if (!this.clientHost.startsWith('http://') && !this.clientHost.startsWith('https://')) {
      this.clientUrl = `http://${this.clientHost}:${this.clientPort}/v1.0`;
    } else {
      this.clientUrl = `${this.clientHost}:${this.clientPort}/v1.0`;
    }

    this.client = fetch;
  }

  getClient(): typeof fetch {
    return this.client;
  }

  getClientHost(): string {
    return this.clientHost;
  }

  getClientPort(): string {
    return this.clientPort;
  }

  getClientUrl(): string {
    return this.clientUrl;
  }

  getClientCommunicationProtocol(): CommunicationProtocolEnum {
    return CommunicationProtocolEnum.HTTP;
  }

  async execute(url: string, params: any = {}): Promise<object | string> {
    if (!params?.headers) {
      params.headers = {};
    }

    if (params?.body && !params?.headers["Content-Type"]) {
      switch (typeof params?.body) {
        case "object":
          params.headers["Content-Type"] = "application/json";
          params.body = JSON.stringify(params?.body);
          break;
        case "string":
          params.headers["Content-Type"] = "text/plain";
          break;
        default:
          console.log(`Unknown body type: ${typeof params?.body}, defaulting to "text/plain"`);
          params.headers["Content-Type"] = "text/plain";
          break;
      }
    }

    const urlFull = url.startsWith("http") ? url : `${this.clientUrl}${url}`;
    // console.log(`${params.method} - ${urlFull} (${params.body})`);
    const res = await fetch(urlFull, params);

    // Parse body
    const txt = await res.text();
    let txtParsed;

    try {
      txtParsed = JSON.parse(txt);
    } catch (e) {
      txtParsed = txt;
    }

    // 2XX -> OK; 3XX -> Redirects and Found
    if (res.status >= 200 && res.status <= 399) {
      return txtParsed;
    }
    // 400 = Bad Request, 401 = Unauthorized, 404 = Not Found
    else if (res.status === 400 || res.status === 401 || res.status === 404) {
      throw new Error(JSON.stringify(txtParsed));
    }
    // 403 = Forbidden
    else if (res.status === 403) {
      throw new Error(JSON.stringify(txtParsed));
    }
    // 500 = Internal Server Error, 502 = Bad Gateway
    else if (res.status === 500 || res.status === 502) {
      throw new Error(JSON.stringify(txtParsed));
    }
    // All the others
    else {
      console.log(txtParsed);
      throw new Error(JSON.stringify({
        error: "UNKNOWN",
        error_msg: `An unknown problem occured and we got the status ${res.status} with response ${res}`
      }));
    }
  }
}