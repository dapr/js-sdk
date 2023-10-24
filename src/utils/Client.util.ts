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

import { randomUUID } from "crypto";
import { Map } from "google-protobuf";

import { ConfigurationItem as ConfigurationItemProto } from "../proto/dapr/proto/common/v1/common_pb";
import { isCloudEvent } from "./CloudEvent.util";

import { KeyValueType } from "../types/KeyValue.type";
import { ConfigurationType } from "../types/configuration/Configuration.type";
import { ConfigurationItem } from "../types/configuration/ConfigurationItem";
import { PubSubBulkPublishEntry } from "../types/pubsub/PubSubBulkPublishEntry.type";
import { PubSubBulkPublishResponse } from "../types/pubsub/PubSubBulkPublishResponse.type";
import { PubSubBulkPublishMessage } from "../types/pubsub/PubSubBulkPublishMessage.type";
import { PubSubBulkPublishApiResponse } from "../types/pubsub/PubSubBulkPublishApiResponse.type";
import { DaprClientOptions } from "../types/DaprClientOptions";
import CommunicationProtocolEnum from "../enum/CommunicationProtocol.enum";
import { Settings } from "./Settings.util";
import { LoggerOptions } from "../types/logger/LoggerOptions";
import { StateConsistencyEnum } from "../enum/StateConsistency.enum";
import { StateConcurrencyEnum } from "../enum/StateConcurrency.enum";
import { URL, URLSearchParams } from "url";

/**
 * Adds metadata to a map.
 * @param map Input map
 * @param metadata key value pair of metadata
 */
export function addMetadataToMap(map: Map<string, string>, metadata: KeyValueType = {}): void {
  for (const [key, value] of Object.entries(metadata)) {
    map.set(key, value);
  }
}

/**
 * Converts one or multiple sets of data to a querystring
 * Each set of data contains a set of KeyValue Pair
 * An optional "metadata" type can be added in each set, in which case
 * the QS key of each data in the set will be prefixed with "metadata.".
 *
 * Note, the returned value does not contain the "?" prefix.
 *
 * @param params one of multiple set of data
 * @returns HTTP query parameter string
 */
export function createHTTPQueryParam(...params: { data?: KeyValueType; type?: "metadata" }[]): string {
  const queryBuilder = new URLSearchParams();

  for (const group of params) {
    if (!group?.data) {
      continue;
    }

    for (const [key, value] of Object.entries(group.data)) {
      let propName = key;
      if (group?.type === "metadata") {
        propName = `metadata.${propName}`;
      }

      if (value !== undefined) {
        queryBuilder.set(propName, value);
      }
    }
  }

  return queryBuilder.toString();
}

/**
 * Return the string representation of a valid consistency configuration
 * @param c
 */
export function getStateConsistencyValue(c?: StateConsistencyEnum): "eventual" | "strong" | undefined {
  switch (c) {
    case StateConsistencyEnum.CONSISTENCY_EVENTUAL:
      return "eventual";
    case StateConsistencyEnum.CONSISTENCY_STRONG:
      return "strong";
    default:
      return undefined;
  }
}

/**
 * Return the string representation of a valid concurrency configuration
 * @param c
 */
export function getStateConcurrencyValue(c?: StateConcurrencyEnum): "first-write" | "last-write" | undefined {
  switch (c) {
    case StateConcurrencyEnum.CONCURRENCY_FIRST_WRITE:
      return "first-write";
    case StateConcurrencyEnum.CONCURRENCY_LAST_WRITE:
      return "last-write";
    default:
      return undefined;
  }
}

/**
 * Converts a Map<string, common_pb.ConfigurationItemProto> to a ConfigurationType object.
 * @param Map<string, common_pb.ConfigurationItemProto>
 * @returns ConfigurationType object
 */
export function createConfigurationType(configDict: Map<string, ConfigurationItemProto>): ConfigurationType {
  const configMap: { [k: string]: ConfigurationItem } = {};

  configDict.forEach(function (v, k) {
    const item: ConfigurationItem = {
      key: k,
      value: v.getValue(),
      version: v.getVersion(),
      metadata: v
        .getMetadataMap()
        .toObject()
        .reduce((result: object, [key, value]) => {
          // @ts-ignore
          result[key] = value;
          return result;
        }, {}),
    };
    configMap[k] = item;
  });
  return configMap;
}

/**
 * Gets the Content-Type for the input data.
 *
 * If the data is a valid Cloud Event, the Content-Type is "application/cloudevents+json".
 * If the data is a JSON object, the Content-Type is "application/json".
 * If the data is a string, the Content-Type is "text/plain".
 * Otherwise, the Content-Type is "application/octet-stream".
 *
 * @param data input data
 * @returns Content-Type header value
 */
export function getContentType(data: any): string {
  // Identify the exact type of the input data
  const type = getType(data);

  switch (type) {
    case "Array":
    case "Object":
      if (isCloudEvent(data as object)) {
        return "application/cloudevents+json";
      } else {
        return "application/json";
      }
    case "Boolean":
    case "Number":
    case "String":
      return "text/plain";
    // Uint8Array, Int8Array, Buffer, SlowBuffer, Blob, etc.
    default:
      return "application/octet-stream";
  }
}

/**
 * Get the entries for bulk publish request.
 * If entryIDs are missing, generate UUIDs for them.
 * If contentTypes are missing, infer them based on the data using {@link getContentType}.
 *
 * @param messages pubsub bulk publish messages
 * @returns configured entries
 */
export function getBulkPublishEntries(messages: PubSubBulkPublishMessage[]): PubSubBulkPublishEntry[] {
  return messages.map((message) => {
    // If message is a PubSubBulkPublishEntry, use it directly
    if (typeof message !== "string" && "event" in message) {
      return {
        entryID: message.entryID ? message.entryID : randomUUID(),
        event: message.event,
        contentType: message.contentType ? message.contentType : getContentType(message.event),
        metadata: message.metadata ? message.metadata : {},
      };
    }
    // Otherwise, create a PubSubBulkPublishEntry from the message
    return {
      entryID: randomUUID(),
      event: message,
      contentType: getContentType(message),
      metadata: {},
    };
  });
}

/**
 * Get the response for bulk publish request.
 *
 * @param response bulk publish API response
 * @param entries entries for bulk publish request
 * @param error error from bulk publish request
 * @returns SDK response for bulk publish request
 */
export function getBulkPublishResponse(
  params:
    | {
        entries: PubSubBulkPublishEntry[];
        response: PubSubBulkPublishApiResponse;
      }
    | {
        entries: PubSubBulkPublishEntry[];
        error: Error;
      },
): PubSubBulkPublishResponse {
  if ("error" in params) {
    // The entire request failed. This typically indicates a problem with the request or the connection.
    const failedMessages = params.entries.map((message) => ({ message, error: params.error }));
    return { failedMessages };
  }

  // Some or all of the entries failed to be published.
  return {
    failedMessages:
      params.response.failedEntries.flatMap((entry) => {
        const message = params.entries.find((message) => message.entryID === entry.entryID);
        if (!message) {
          return [];
        }
        return { message, error: new Error(entry.error) };
      }) ?? [],
  };
}

/**
 * Determine the type of the input data by checking the constructor name
 * If no name is found, we return the typeof the input data
 *
 * @param arr
 * @returns string The Data Type, e.g., Uint8Array, Int8Array, Buffer, SlowBuffer, Blob, Oject, Array, etc.
 */
function getType(o: any) {
  // If the type is set in the constructor name, return the name
  // e.g., Uint8Array, Int8Array, Buffer, SlowBuffer, Blob, etc.
  if (o.constructor.name) {
    return o.constructor.name;
  }

  return typeof o;
}

/**
 * Prepares DaprClientOptions for use by the DaprClient/DaprServer.
 * If the user does not provide a value for a mandatory option, the default value is used.
 * @param clientOptions DaprClientOptions
 * @param defaultCommunicationProtocol CommunicationProtocolEnum
 * @param defaultLoggerOptions
 * @returns DaprClientOptions
 */
export function getClientOptions(
  clientOptions: Partial<DaprClientOptions> | undefined,
  defaultCommunicationProtocol: CommunicationProtocolEnum,
  defaultLoggerOptions: LoggerOptions | undefined,
): DaprClientOptions {
  const clientCommunicationProtocol = clientOptions?.communicationProtocol ?? defaultCommunicationProtocol;

  // We decide the host/port/endpoint here
  let host = Settings.getDefaultHost();
  let port = Settings.getDefaultPort(clientCommunicationProtocol);
  let uri = `${host}:${port}`;

  let endpoint: Endpoint;

  if (clientOptions?.daprHost || clientOptions?.daprPort) {
    host = clientOptions?.daprHost ?? host;
    port = clientOptions?.daprPort ?? port;
    uri = `${host}:${port}`;
  } else if (clientCommunicationProtocol == CommunicationProtocolEnum.HTTP && Settings.getDefaultHttpEndpoint() != "") {
    uri = Settings.getDefaultHttpEndpoint();
  } else if (clientCommunicationProtocol == CommunicationProtocolEnum.GRPC && Settings.getDefaultGrpcEndpoint() != "") {
    uri = Settings.getDefaultGrpcEndpoint();
  }

  if (clientCommunicationProtocol == CommunicationProtocolEnum.HTTP) {
    endpoint = new HttpEndpoint(uri);
  } else {
    endpoint = new GrpcEndpoint(uri);
  }

  return {
    daprHost: endpoint.hostname,
    daprPort: endpoint.port,
    daprEndpoint: endpoint,
    communicationProtocol: clientCommunicationProtocol,
    isKeepAlive: clientOptions?.isKeepAlive,
    logger: clientOptions?.logger ?? defaultLoggerOptions,
    actor: clientOptions?.actor,
    daprApiToken: clientOptions?.daprApiToken,
    maxBodySizeMb: clientOptions?.maxBodySizeMb,
  };
}

class URIParseConfig {
  static readonly DEFAULT_SCHEME_GRPC = "dns";
  static readonly DEFAULT_SCHEME_HTTP = "http";
  static readonly DEFAULT_HOSTNAME = "localhost";
  static readonly DEFAULT_PORT = 443;
  static readonly DEFAULT_AUTHORITY = "";
  static readonly ACCEPTED_SCHEMES_GRPC = ["dns", "unix", "unix-abstract", "vsock", "http", "https", "grpc", "grpcs"];
}

export abstract class Endpoint {
  protected _scheme = "";
  protected _hostname = "";
  protected _port = 0;
  protected _tls = false;
  protected _authority = "";
  protected _url: string;
  protected _endpoint = "";
  protected _parsedUrl!: URL;

  protected constructor(url: string) {
    this._url = url;
  }

  get tls(): boolean {
    return this._tls;
  }

  get hostname(): string {
    return this._hostname;
  }

  get scheme(): string {
    return this._scheme;
  }

  get port(): string {
    return this._port === 0 ? "" : this._port.toString();
  }

  get endpoint(): string {
    return this._endpoint;
  }
}

export class HttpEndpoint extends Endpoint {
  constructor(url: string) {
    super(url);
    this._parsedUrl = new URL(this.preprocessUri(url));

    try {
      this._scheme = this._parsedUrl.protocol.replace(":", "");
      this._hostname = this._parsedUrl.hostname.replace("[", "");
      this._hostname = this._hostname.replace("]", "");
      this._port = parseInt(this._parsedUrl.port) || (this._scheme == "https" ? 443 : 80);
      this._tls = this._scheme == "https";
      this._endpoint = this._scheme + "://" + this._hostname + ":" + this._port.toString();
    } catch (error) {
      throw new Error(`Invalid address: ${url}`);
    }
  }

  // We need to add a default scheme and hostname to the url
  // if they are not specified so that the URL class can parse it
  private preprocessUri(url: string) {
    if (url.startsWith(":")) {
      url = URIParseConfig.DEFAULT_SCHEME_HTTP + "://" + URIParseConfig.DEFAULT_HOSTNAME + url;
    }
    if (!url.includes("://")) {
      url = URIParseConfig.DEFAULT_SCHEME_HTTP + "://" + url;
    }
    return url;
  }
}

export class GrpcEndpoint extends Endpoint {
  constructor(url: string) {
    super(url);
    this._authority = URIParseConfig.DEFAULT_AUTHORITY;

    this._parsedUrl = new URL(this.preprocessUri(url));
    this.validatePathAndQuery();

    this.setTls();
    this.setHostname();
    this.setScheme();
    this.setPort();
    this.setEndpoint();
  }

  private preprocessUri(url: string): string {
    let urlList = url.split(":");

    if (urlList.length === 3 && !url.includes("://")) {
      // A URI like dns:mydomain:5000 or vsock:mycid:5000 was used
      url = url.replace(":", "://");
    } else if (
      urlList.length >= 2 &&
      !url.includes("://") &&
      URIParseConfig.ACCEPTED_SCHEMES_GRPC.includes(urlList[0])
    ) {
      // A URI like dns:mydomain was used
      url = url.replace(":", "://");
    } else {
      urlList = url.split("://");
      if (urlList.length === 1) {
        // If a scheme was not explicitly specified in the URL
        // we need to add a default scheme,
        // because of how URL works in JavaScript

        // We also need to check if the provided uri is not of the form :5000
        // if it is, we need to add a default hostname, because the URL class can't parse it
        if (url[0] === ":") {
          url = `${URIParseConfig.DEFAULT_SCHEME_GRPC}://${URIParseConfig.DEFAULT_HOSTNAME}${url}`;
        } else {
          url = `${URIParseConfig.DEFAULT_SCHEME_GRPC}://${url}`;
        }
      } else {
        // If a scheme was explicitly specified in the URL
        // we need to make sure it is a valid scheme
        const scheme = urlList[0];
        if (!URIParseConfig.ACCEPTED_SCHEMES_GRPC.includes(scheme)) {
          throw new Error(`Invalid scheme '${scheme}' in URL '${url}'`);
        }

        // We should do a special check if the scheme is dns, and it uses
        // an authority in the format of dns:[//authority/]host[:port]
        if (scheme.toLowerCase() === "dns") {
          // A URI like dns://authority/mydomain was used
          urlList = url.split("/");
          if (urlList.length < 4) {
            throw new Error(`Invalid dns authority '${urlList[2]}' in URL '${url}'`);
          }
          this._authority = urlList[2];
          url = `dns://${urlList[3]}`;
        }
      }
    }
    return url;
  }

  private validatePathAndQuery(): void {
    if (this._parsedUrl.pathname && this._parsedUrl.pathname !== "/") {
      throw new Error(`Paths are not supported for gRPC endpoints: '${this._parsedUrl.pathname}'`);
    }

    const params = new URLSearchParams(this._parsedUrl.search);
    if (params.has("tls") && (this._parsedUrl.protocol === "http:" || this._parsedUrl.protocol === "https:")) {
      throw new Error(`The tls query parameter is not supported for http(s) endpoints: '${this._parsedUrl.search}'`);
    }

    params.delete("tls");
    if (Array.from(params.keys()).length > 0) {
      throw new Error(`Query parameters are not supported for gRPC endpoints: '${this._parsedUrl.search}'`);
    }
  }

  private setTls(): void {
    const params = new URLSearchParams(this._parsedUrl.search);
    const tlsStr = params.get("tls") || "";
    this._tls = tlsStr.toLowerCase() === "true";

    if (this._parsedUrl.protocol == "https:") {
      this._tls = true;
    }
  }

  private setHostname(): void {
    if (!this._parsedUrl.hostname) {
      this._hostname = URIParseConfig.DEFAULT_HOSTNAME;
      return;
    }

    this._hostname = this._parsedUrl.hostname;
  }

  private setScheme(): void {
    if (!this._parsedUrl.protocol) {
      this._scheme = URIParseConfig.DEFAULT_SCHEME_GRPC;
      return;
    }

    const scheme = this._parsedUrl.protocol.slice(0, -1); // Remove trailing ':'
    if (scheme === "http" || scheme === "https") {
      this._scheme = URIParseConfig.DEFAULT_SCHEME_GRPC;
      console.warn("http and https schemes are deprecated, use grpc or grpcs instead");
      return;
    }

    if (!URIParseConfig.ACCEPTED_SCHEMES_GRPC.includes(scheme)) {
      throw new Error(`Invalid scheme '${scheme}' in URL '${this._url}'`);
    }

    this._scheme = scheme;
  }

  private setPort(): void {
    if (this._scheme === "unix" || this._scheme === "unix-abstract") {
      this._port = 0;
      return;
    }

    this._port = this._parsedUrl.port ? parseInt(this._parsedUrl.port) : URIParseConfig.DEFAULT_PORT;
  }

  private setEndpoint(): void {
    const port = this._port ? `:${this.port}` : "";

    if (this._scheme === "unix") {
      const separator = this._url.startsWith("unix://") ? "://" : ":";
      this._endpoint = `${this._scheme}${separator}${this._hostname}`;
      return;
    }

    if (this._scheme === "vsock") {
      this._endpoint = `${this._scheme}:${this._hostname}:${this.port}`;
      return;
    }

    if (this._scheme === "unix-abstract") {
      this._endpoint = `${this._scheme}:${this._hostname}${port}`;
      return;
    }

    if (this._scheme === "dns") {
      const authority = this._authority ? `//${this._authority}/` : "";
      this._endpoint = `${this._scheme}:${authority}${this._hostname}${port}`;
      return;
    }

    this._endpoint = `${this._scheme}:${this._hostname}${port}`;
  }
}
