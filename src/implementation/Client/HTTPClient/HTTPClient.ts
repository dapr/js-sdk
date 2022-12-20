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

import fetch from "node-fetch";
import { CommunicationProtocolEnum, DaprClient } from "../../..";
import IClient from "../../../interfaces/Client/IClient";
import http from "http";
import https from "https";
import { DaprClientOptions } from "../../../types/DaprClientOptions";
import { Settings } from "../../../utils/Settings.util";
import { THTTPExecuteParams } from "../../../types/http/THTTPExecuteParams.type";
import { Logger } from "../../../logger/Logger";
import HTTPClientSidecar from "./sidecar";
import { SDK_VERSION } from "../../../version";

type HTTPClientResponse = {
  status: number;
  body: object | string;
  error?: Error;
};

export default class HTTPClient implements IClient {
  private isInitialized: boolean;

  private static client: typeof fetch;
  private readonly clientHost: string;
  private readonly clientPort: string;
  private readonly clientUrl: string;
  private readonly options: DaprClientOptions;
  private readonly logger: Logger;

  private static httpAgent: http.Agent;
  private static httpsAgent: https.Agent;

  constructor(host = Settings.getDefaultHost(), port = Settings.getDefaultHttpPort(), options: DaprClientOptions = {}) {
    this.clientHost = host;
    this.clientPort = port;
    this.options = options;
    this.logger = new Logger("HTTPClient", "HTTPClient", this.options.logger);
    this.isInitialized = false;
    // fallback to default
    if (this.options.isKeepAlive === undefined) {
      this.options.isKeepAlive = true;
    }

    if (!this.clientHost.startsWith("http://") && !this.clientHost.startsWith("https://")) {
      this.clientUrl = `http://${this.clientHost}:${this.clientPort}/v1.0`;
    } else {
      this.clientUrl = `${this.clientHost}:${this.clientPort}/v1.0`;
    }

    if (!HTTPClient.client) {
      HTTPClient.client = fetch;
    }

    // Add a custom agent so we can decide if we want to reuse connections or not
    // we use an agent so we can reuse an open connection, limiting handshake requirements
    // Note: when using an agent, we will encounter TCPWRAP since the connection doesn't get destroyed
    const keepAlive = this.options.isKeepAlive;
    const keepAliveMsecs = 30 * 1000; // it is applicable only when keepAlive is set to true

    if (!HTTPClient.httpAgent) {
      HTTPClient.httpAgent = new http.Agent({ keepAlive: keepAlive, keepAliveMsecs: keepAliveMsecs });
    }
    if (!HTTPClient.httpsAgent) {
      HTTPClient.httpsAgent = new https.Agent({ keepAlive: keepAlive, keepAliveMsecs: keepAliveMsecs });
    }
  }

  async getClient(requiresInitialization = true): Promise<typeof fetch> {
    // Ensure the sidecar has been started
    if (requiresInitialization && !this.isInitialized) {
      this.logger.verbose("Client is not initialized, starting sidecar and initializing");
      await this.start();
    }

    return HTTPClient.client;
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

  setIsInitialized(isInitialized: boolean): void {
    this.isInitialized = isInitialized;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  async _startAwaitSidecarStarted(): Promise<void> {
    await DaprClient.awaitSidecarStarted(async () => await HTTPClientSidecar.isStarted(this), this.logger);
  }

  async stop(): Promise<void> {
    HTTPClient.httpAgent.destroy();
    HTTPClient.httpsAgent.destroy();
  }

  async start(): Promise<void> {
    await this._startAwaitSidecarStarted();
    this.isInitialized = true;

    this.logger.info("Sidecar Started");

    return;
  }

  async executeWithApiVersion(apiVersion = "v1.0", url: string, params: any = {}): Promise<HTTPClientResponse> {
    const newClientUrl = this.clientUrl.replace("v1.0", apiVersion);
    return await this.execute(`${newClientUrl}${url}`, params);
  }

  /**
   *
   * @param url The URL to call
   * @param params The parameters to pass to our URL
   * @param requiresInitialization If false, it doesn't require the Dapr sidecar to be started and might fail
   * @returns The result of the call
   */
  async execute(
    url: string,
    params?: THTTPExecuteParams | undefined | null,
    requiresInitialization = true,
  ): Promise<HTTPClientResponse> {
    if (!params || typeof params !== "object") {
      params = {
        method: "GET",
      };
    }

    if (!params?.headers) {
      params.headers = {};
    }

    if (this.options.daprApiToken) {
      params.headers["dapr-api-token"] = this.options.daprApiToken;
    }

    params.headers["user-agent"] = `dapr-sdk-js/v${SDK_VERSION} http/1`;

    if (!params?.method) {
      params.method = "GET";
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
          this.logger.warn(`Unknown body type: ${typeof params?.body}, defaulting to "text/plain"`);
          params.headers["Content-Type"] = "text/plain";
          break;
      }
    }

    const urlFull = url.startsWith("http") ? url : `${this.clientUrl}${url}`;
    const agent = urlFull.startsWith("https") ? HTTPClient.httpsAgent : HTTPClient.httpAgent;
    params.agent = agent;

    this.logger.debug(`Fetching ${params.method} ${urlFull} with body: (${params.body})`);

    const client = await this.getClient(requiresInitialization);
    const res = await client(urlFull, params);

    // Parse body
    const txt = await res.text();
    let txtParsed;

    try {
      txtParsed = JSON.parse(txt);
    } catch (e) {
      txtParsed = txt;
    }

    const response: HTTPClientResponse = { status: res.status, body: txtParsed };

    // 2XX -> OK; 3XX -> Redirects and Found
    if (res.status >= 200 && res.status <= 399) {
      return response;
    } else {
      response.error = new Error(res.statusText);
      return response;
    }
  }
}
