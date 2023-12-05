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

import { Endpoint } from "./AbstractEndpoint";
import { URIParseConfig } from "./Network.consts";
import { URL, URLSearchParams } from "url";

export class GrpcEndpoint extends Endpoint {
  private _authority = "";

  constructor(url: string) {
    super(url);
    this._authority = URIParseConfig.DEFAULT_AUTHORITY;

    const parsedUrl = new URL(this.preprocessUri(url));
    this.validatePathAndQuery(parsedUrl);

    this.setTls(parsedUrl);
    this.setHostname(parsedUrl);
    this.setScheme(parsedUrl);
    this.setPort(parsedUrl);
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

  private validatePathAndQuery(parsedUrl: URL): void {
    if (parsedUrl.pathname && parsedUrl.pathname !== "/") {
      throw new Error(`Paths are not supported for gRPC endpoints: '${parsedUrl.pathname}'`);
    }

    const params = new URLSearchParams(parsedUrl.search);
    if (params.has("tls") && (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:")) {
      throw new Error(`The tls query parameter is not supported for http(s) endpoints: '${parsedUrl.search}'`);
    }

    params.delete("tls");
    if (Array.from(params.keys()).length > 0) {
      throw new Error(`Query parameters are not supported for gRPC endpoints: '${parsedUrl.search}'`);
    }
  }

  private setTls(parsedUrl: URL): void {
    const params = new URLSearchParams(parsedUrl.search);
    const tlsStr = params.get("tls") || "";
    this._tls = tlsStr.toLowerCase() === "true";

    if (parsedUrl.protocol == "https:") {
      this._tls = true;
    }
  }

  private setHostname(parsedUrl: URL): void {
    if (!parsedUrl.hostname) {
      this._hostname = URIParseConfig.DEFAULT_HOSTNAME;
      return;
    }

    this._hostname = parsedUrl.hostname;
  }

  private setScheme(parsedUrl: URL): void {
    if (!parsedUrl.protocol) {
      this._scheme = URIParseConfig.DEFAULT_SCHEME_GRPC;
      return;
    }

    const scheme = parsedUrl.protocol.slice(0, -1); // Remove trailing ':'
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

  private setPort(parsedUrl: URL): void {
    if (this._scheme === "unix" || this._scheme === "unix-abstract") {
      this._port = 0;
      return;
    }

    this._port = parsedUrl.port ? parseInt(parsedUrl.port) : URIParseConfig.DEFAULT_PORT;
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
