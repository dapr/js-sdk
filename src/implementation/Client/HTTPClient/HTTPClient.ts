import fetch from "node-fetch";
import { CommunicationProtocolEnum } from "../../..";
import IClient from "../../../interfaces/Client/IClient";
import http from "http";
import https from "https";
import { DaprClientOptions } from "../../../types/DaprClientOptions";

export default class HTTPClient implements IClient {
  private readonly isInitialized: boolean;
  private client: typeof fetch;
  private readonly clientHost: string;
  private readonly clientPort: string;
  private readonly clientUrl: string;
  private readonly options: DaprClientOptions;

  private readonly httpAgent;
  private readonly httpsAgent;

  constructor(host = "127.0.0.1", port = "50050", options: DaprClientOptions = {
    isKeepAlive: true
  }) {
    this.isInitialized = true;
    this.clientHost = host;
    this.clientPort = port;
    this.options = options;

    if (!this.clientHost.startsWith('http://') && !this.clientHost.startsWith('https://')) {
      this.clientUrl = `http://${this.clientHost}:${this.clientPort}/v1.0`;
    } else {
      this.clientUrl = `${this.clientHost}:${this.clientPort}/v1.0`;
    }

    this.client = fetch;

    // Add a custom agent so we can decide if we want to reuse connections or not
    // we use an agent so we can reuse an open connection, limiting handshake requirements
    // Note: when using an agent, we will encounter TCPWRAP since the connection doesn't get destroyed
    if (this.options.isKeepAlive) {
      this.httpAgent = new http.Agent({ keepAlive: true, keepAliveMsecs: 30 * 1000 });
      this.httpsAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 30 * 1000 });
    } else {
      this.httpAgent = new http.Agent();
      this.httpsAgent = new https.Agent();
    }
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

  getOptions(): DaprClientOptions {
    return this.options;
  }

  async stop(): Promise<void> {
    this.httpAgent.destroy();
    this.httpsAgent.destroy();
  }

  async executeWithApiVersion(apiVersion = "v1.0", url: string, params: any = {}): Promise<object | string> {
    const newClientUrl = this.clientUrl.replace("v1.0", apiVersion);
    return await this.execute(`${newClientUrl}${url}`, params);
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
    const agent = urlFull.startsWith("https") ? this.httpsAgent : this.httpAgent;
    params.agent = agent;

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
        error_msg: `An unknown problem occured and we got the status ${res.status} with response ${JSON.stringify(res)}`
      }));
    }
  }
}