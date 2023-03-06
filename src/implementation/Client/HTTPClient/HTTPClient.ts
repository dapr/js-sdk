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

import fetch, { RequestInit } from "node-fetch";
import { DaprClient } from "../../..";
import IClient from "../../../interfaces/Client/IClient";
import http from "http";
import https from "https";
import { DaprClientOptions } from "../../../types/DaprClientOptions";
import { Settings } from "../../../utils/Settings.util";
import { THTTPExecuteParams } from "../../../types/http/THTTPExecuteParams.type";
import { Logger } from "../../../logger/Logger";
import HTTPClientSidecar from "./sidecar";
import { SDK_VERSION } from "../../../version";
import * as SerializerUtil from "../../../utils/Serializer.util";

export default class HTTPClient implements IClient {
  readonly options: DaprClientOptions;

  private isInitialized: boolean;
  private static client: typeof fetch;
  private readonly clientUrl: string;
  private readonly logger: Logger;

  private static httpAgent: http.Agent;
  private static httpsAgent: https.Agent;

  constructor(options: DaprClientOptions) {
    this.options = options;
    this.logger = new Logger("HTTPClient", "HTTPClient", this.options.logger);
    this.isInitialized = false;

    this.clientUrl = `${this.options.daprHost}:${this.options.daprPort}/v1.0`;
    if (!this.clientUrl.startsWith("http://") && !this.clientUrl.startsWith("https://")) {
      this.clientUrl = `http://${this.clientUrl}`;
    }

    if (!HTTPClient.client) {
      HTTPClient.client = fetch;
    }

    // Add a custom agent so we can decide if we want to reuse connections or not
    // we use an agent so we can reuse an open connection, limiting handshake requirements
    // Note: when using an agent, we will encounter TCPWRAP since the connection doesn't get destroyed
    const keepAlive = this.options.isKeepAlive ?? Settings.getDefaultKeepAlive();
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

  async executeWithApiVersion(apiVersion = "v1.0", url: string, params: any = {}): Promise<object | string> {
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
  ): Promise<object | string> {
    const clientOptions: RequestInit = {};

    // Set Method
    clientOptions.method = params?.method.toLocaleUpperCase() || (params?.body ? "POST" : "GET");

    // Set Headers
    clientOptions.headers = params?.headers ?? {};

    if (this.options.daprApiToken) {
      clientOptions.headers["dapr-api-token"] = this.options.daprApiToken;
    }

    clientOptions.headers["user-agent"] = `dapr-sdk-js/v${SDK_VERSION} http/1`;

    // Set Body and Content-Type Header
    if (params?.body) {
      const { serializedData, contentType } = SerializerUtil.serializeHttp(params?.body);

      // Don't overwrite it
      if (!params?.headers?.["Content-Type"]) {
        clientOptions.headers["Content-Type"] = contentType;
      }

      clientOptions.body = serializedData;
    }

    const urlFull = url.startsWith("http") ? url : `${this.clientUrl}${url}`;
    const agent = urlFull.startsWith("https") ? HTTPClient.httpsAgent : HTTPClient.httpAgent;
    clientOptions.agent = agent;

    this.logger.debug(
      `Fetching ${clientOptions.method} ${urlFull} with (headers: ${JSON.stringify(
        clientOptions.headers,
      )}, body size: ${(clientOptions.body?.toString()?.length ?? 0) / 1024 / 1024} Mb)`,
    );

    const client = await this.getClient(requiresInitialization);
    const res = await client(urlFull, clientOptions);

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
    } else {
      throw new Error(
        JSON.stringify({
          error: res.statusText,
          error_msg: txt,
          status: res.status,
        }),
      );
    }
  }
}
