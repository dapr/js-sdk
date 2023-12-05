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

import { GrpcEndpoint } from "../../../src/network/GrpcEndpoint";
import { HttpEndpoint } from "../../../src/network/HttpEndpoint";

describe("Client.util", () => {
  describe("parse GRPC Endpoint", () => {
    const testCases = [
      // Port only
      {
        url: ":5000",
        error: false,
        secure: false,
        scheme: "",
        host: "localhost",
        port: 5000,
        endpoint: "dns:localhost:5000",
      },
      {
        url: ":5000?tls=false",
        error: false,
        secure: false,
        scheme: "",
        host: "localhost",
        port: 5000,
        endpoint: "dns:localhost:5000",
      },
      {
        url: ":5000?tls=true",
        error: false,
        secure: true,
        scheme: "",
        host: "localhost",
        port: 5000,
        endpoint: "dns:localhost:5000",
      },
      // Host only
      {
        url: "myhost",
        error: false,
        secure: false,
        scheme: "",
        host: "myhost",
        port: 443,
        endpoint: "dns:myhost:443",
      },
      {
        url: "myhost?tls=false",
        error: false,
        secure: false,
        scheme: "",
        host: "myhost",
        port: 443,
        endpoint: "dns:myhost:443",
      },
      {
        url: "myhost?tls=true",
        error: false,
        secure: true,
        scheme: "",
        host: "myhost",
        port: 443,
        endpoint: "dns:myhost:443",
      },
      // Host and port
      {
        url: "myhost:443",
        error: false,
        secure: false,
        scheme: "",
        host: "myhost",
        port: 443,
        endpoint: "dns:myhost:443",
      },
      {
        url: "myhost:443?tls=false",
        error: false,
        secure: false,
        scheme: "",
        host: "myhost",
        port: 443,
        endpoint: "dns:myhost:443",
      },
      {
        url: "myhost:443?tls=true",
        error: false,
        secure: true,
        scheme: "",
        host: "myhost",
        port: 443,
        endpoint: "dns:myhost:443",
      },
      // Scheme, host and port
      {
        url: "http://myhost",
        error: false,
        secure: false,
        scheme: "",
        host: "myhost",
        port: 443,
        endpoint: "dns:myhost:443",
      },
      { url: "http://myhost?tls=false", error: true },
      { url: "http://myhost?tls=true", error: true },
      {
        url: "http://myhost:443",
        error: false,
        secure: false,
        scheme: "",
        host: "myhost",
        port: 443,
        endpoint: "dns:myhost:443",
      },
      { url: "http://myhost:443?tls=false", error: true },
      { url: "http://myhost:443?tls=true", error: true },
      {
        url: "http://myhost:5000",
        error: false,
        secure: false,
        scheme: "",
        host: "myhost",
        port: 5000,
        endpoint: "dns:myhost:5000",
      },
      { url: "http://myhost:5000?tls=false", error: true },
      { url: "http://myhost:5000?tls=true", error: true },
      {
        url: "https://myhost:443",
        error: false,
        secure: true,
        scheme: "",
        host: "myhost",
        port: 443,
        endpoint: "dns:myhost:443",
      },
      { url: "https://myhost:443?tls=false", error: true },
      { url: "https://myhost:443?tls=true", error: true },
      // Scheme = dns
      {
        url: "dns:myhost",
        error: false,
        secure: false,
        scheme: "dns",
        host: "myhost",
        port: 443,
        endpoint: "dns:myhost:443",
      },
      {
        url: "dns:myhost?tls=false",
        error: false,
        secure: false,
        scheme: "dns",
        host: "myhost",
        port: 443,
        endpoint: "dns:myhost:443",
      },
      {
        url: "dns:myhost?tls=true",
        error: false,
        secure: true,
        scheme: "dns",
        host: "myhost",
        port: 443,
        endpoint: "dns:myhost:443",
      },
      // Scheme = dns with authority
      {
        url: "dns://myauthority:53/myhost",
        error: false,
        secure: false,
        scheme: "dns",
        host: "myhost",
        port: 443,
        endpoint: "dns://myauthority:53/myhost:443",
      },
      {
        url: "dns://myauthority:53/myhost?tls=false",
        error: false,
        secure: false,
        scheme: "dns",
        host: "myhost",
        port: 443,
        endpoint: "dns://myauthority:53/myhost:443",
      },
      {
        url: "dns://myauthority:53/myhost?tls=true",
        error: false,
        secure: true,
        scheme: "dns",
        host: "myhost",
        port: 443,
        endpoint: "dns://myauthority:53/myhost:443",
      },
      { url: "dns://myhost", error: true },
      // Unix sockets
      {
        url: "unix:my.sock",
        error: false,
        secure: false,
        scheme: "unix",
        host: "my.sock",
        port: "",
        endpoint: "unix:my.sock",
      },
      {
        url: "unix:my.sock?tls=true",
        error: false,
        secure: true,
        scheme: "unix",
        host: "my.sock",
        port: "",
        endpoint: "unix:my.sock",
      },
      // Unix sockets with absolute path
      {
        url: "unix://my.sock",
        error: false,
        secure: false,
        scheme: "unix",
        host: "my.sock",
        port: "",
        endpoint: "unix://my.sock",
      },
      {
        url: "unix://my.sock?tls=true",
        error: false,
        secure: true,
        scheme: "unix",
        host: "my.sock",
        port: "",
        endpoint: "unix://my.sock",
      },
      // Unix abstract sockets
      {
        url: "unix-abstract:my.sock",
        error: false,
        secure: false,
        scheme: "unix",
        host: "my.sock",
        port: "",
        endpoint: "unix-abstract:my.sock",
      },
      {
        url: "unix-abstract:my.sock?tls=true",
        error: false,
        secure: true,
        scheme: "unix",
        host: "my.sock",
        port: "",
        endpoint: "unix-abstract:my.sock",
      },
      // Vsock
      {
        url: "vsock:mycid",
        error: false,
        secure: false,
        scheme: "vsock",
        host: "mycid",
        port: "443",
        endpoint: "vsock:mycid:443",
      },
      {
        url: "vsock:mycid:5000",
        error: false,
        secure: false,
        scheme: "vsock",
        host: "mycid",
        port: 5000,
        endpoint: "vsock:mycid:5000",
      },
      {
        url: "vsock:mycid:5000?tls=true",
        error: false,
        secure: true,
        scheme: "vsock",
        host: "mycid",
        port: 5000,
        endpoint: "vsock:mycid:5000",
      },

      // IPv6 addresses
      {
        url: "[2001:db8:1f70:0:999:de8:7648:6e8]",
        error: false,
        secure: false,
        scheme: "",
        host: "[2001:db8:1f70:0:999:de8:7648:6e8]",
        port: 443,
        endpoint: "dns:[2001:db8:1f70:0:999:de8:7648:6e8]:443",
      },
      {
        url: "dns:[2001:db8:1f70:0:999:de8:7648:6e8]",
        error: false,
        secure: false,
        scheme: "",
        host: "[2001:db8:1f70:0:999:de8:7648:6e8]",
        port: 443,
        endpoint: "dns:[2001:db8:1f70:0:999:de8:7648:6e8]:443",
      },
      {
        url: "dns:[2001:db8:1f70:0:999:de8:7648:6e8]:5000",
        error: false,
        secure: false,
        scheme: "",
        host: "[2001:db8:1f70:0:999:de8:7648:6e8]",
        port: 5000,
        endpoint: "dns:[2001:db8:1f70:0:999:de8:7648:6e8]:5000",
      },
      {
        url: "dns:[2001:db8:1f70:0:999:de8:7648:6e8]:5000?abc=[]",
        error: true,
      },
      {
        url: "https://[2001:db8:1f70:0:999:de8:7648:6e8]",
        error: false,
        secure: true,
        scheme: "",
        host: "[2001:db8:1f70:0:999:de8:7648:6e8]",
        port: 443,
        endpoint: "dns:[2001:db8:1f70:0:999:de8:7648:6e8]:443",
      },
      {
        url: "https://[2001:db8:1f70:0:999:de8:7648:6e8]:5000",
        error: false,
        secure: true,
        scheme: "",
        host: "[2001:db8:1f70:0:999:de8:7648:6e8]",
        port: 5000,
        endpoint: "dns:[2001:db8:1f70:0:999:de8:7648:6e8]:5000",
      },

      // Invalid addresses (with path and queries)
      { url: "host:5000/v1/dapr", error: true },
      { url: "host:5000/?a=1", error: true },

      // Invalid scheme
      { url: "inv-scheme://myhost", error: true },
      { url: "inv-scheme:myhost:5000", error: true },
    ];

    testCases.forEach((testCase) => {
      test(`Testing URL: ${testCase.url}`, () => {
        if (testCase.error) {
          expect(() => new GrpcEndpoint(testCase.url)).toThrow(Error);
        } else {
          const url = new GrpcEndpoint(testCase.url);
          expect(url.endpoint).toBe(testCase.endpoint);
          expect(url.tls).toBe(testCase.secure);
          expect(url.hostname).toBe(testCase.host);
          expect(url.port).toBe(String(testCase.port));
        }
      });
    });
  });

  describe("parse HTTP Endpoint", () => {
    const testCases = [
      {
        url: "myhost",
        error: false,
        secure: false,
        scheme: "",
        host: "myhost",
        port: 80,
        endpoint: "http://myhost:80",
      },
      {
        url: "http://myhost",
        error: false,
        secure: false,
        scheme: "",
        host: "myhost",
        port: 80,
        endpoint: "http://myhost:80",
      },
      {
        url: "http://myhost:443",
        error: false,
        secure: false,
        scheme: "",
        host: "myhost",
        port: 443,
        endpoint: "http://myhost:443",
      },
      {
        url: "http://myhost:5000",
        error: false,
        secure: false,
        scheme: "",
        host: "myhost",
        port: 5000,
        endpoint: "http://myhost:5000",
      },
      {
        url: "https://myhost:443",
        error: false,
        secure: true,
        scheme: "",
        host: "myhost",
        port: 443,
        endpoint: "https://myhost:443",
      },
      {
        url: "https://myhost:5000",
        error: false,
        secure: true,
        scheme: "",
        host: "myhost",
        port: 5000,
        endpoint: "https://myhost:5000",
      },
      {
        url: "https://[2001:db8:1f70:0:999:de8:7648:6e8]:5000",
        error: false,
        secure: true,
        scheme: "",
        host: "2001:db8:1f70:0:999:de8:7648:6e8",
        port: 5000,
        endpoint: "https://[2001:db8:1f70:0:999:de8:7648:6e8]:5000",
      },
    ];

    testCases.forEach((testCase) => {
      test(`Testing URL: ${testCase.url}`, () => {
        if (testCase.error) {
          expect(() => new HttpEndpoint(testCase.url)).toThrow(Error);
        } else {
          const url = new HttpEndpoint(testCase.url);
          expect(url.endpoint).toBe(testCase.endpoint);
          expect(url.tls).toBe(testCase.secure);
          expect(url.hostname).toBe(testCase.host);
          expect(url.port).toBe(String(testCase.port));
        }
      });
    });
  });
});
