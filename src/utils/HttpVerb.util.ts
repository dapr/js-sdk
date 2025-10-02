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

import { HTTPExtension_Verb } from "../proto/dapr/proto/common/v1/common_pb";

export function convertHttpVerbNumberToString(verbNumber: HTTPExtension_Verb): string {
  switch (verbNumber) {
    case HTTPExtension_Verb.GET:
      return "GET";
    case HTTPExtension_Verb.POST:
      return "POST";
    case HTTPExtension_Verb.DELETE:
      return "DELETE";
    case HTTPExtension_Verb.PUT:
      return "PUT";
    case HTTPExtension_Verb.PATCH:
      return "PATCH";
    case HTTPExtension_Verb.TRACE:
      return "TRACE";
    case HTTPExtension_Verb.CONNECT:
      return "CONNECT";
    case HTTPExtension_Verb.HEAD:
      return "HEAD";
    case HTTPExtension_Verb.NONE:
      return "NONE";
    case HTTPExtension_Verb.OPTIONS:
      return "OPTIONS";
  }

  return "NONE";
}

export function convertHttpVerbStringToNumber(verbStr: string): HTTPExtension_Verb {
  switch (verbStr.toUpperCase()) {
    case "GET":
      return HTTPExtension_Verb.GET;
    case "POST":
      return HTTPExtension_Verb.POST;
    case "DELETE":
      return HTTPExtension_Verb.DELETE;
    case "PUT":
      return HTTPExtension_Verb.PUT;
    case "PATCH":
      return HTTPExtension_Verb.PATCH;
    case "TRACE":
      return HTTPExtension_Verb.TRACE;
    case "CONNECT":
      return HTTPExtension_Verb.CONNECT;
    case "HEAD":
      return HTTPExtension_Verb.HEAD;
    case "NONE":
      return HTTPExtension_Verb.NONE;
    case "OPTIONS":
      return HTTPExtension_Verb.OPTIONS;
  }

  return HTTPExtension_Verb.NONE;
}
