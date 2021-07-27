import { HTTPExtension } from "../proto/dapr/proto/common/v1/common_pb";

export function convertHttpVerbNumberToString(verbNumber: HTTPExtension.Verb): string {
    switch (verbNumber) {
        case HTTPExtension.Verb.GET:
            return "GET";
        case HTTPExtension.Verb.POST:
            return "POST";
        case HTTPExtension.Verb.DELETE:
            return "DELETE";
        case HTTPExtension.Verb.PUT:
            return "PUT";
        case HTTPExtension.Verb.TRACE:
            return "TRACE";
        case HTTPExtension.Verb.CONNECT:
            return "CONNECT";
        case HTTPExtension.Verb.HEAD:
            return "HEAD";
        case HTTPExtension.Verb.NONE:
            return "NONE";
        case HTTPExtension.Verb.OPTIONS:
            return "OPTIONS";
    }

    return "NONE";
}

export function convertHttpVerbStringToNumber(verbStr: string): HTTPExtension.Verb {
    switch (verbStr.toUpperCase()) {
        case "GET":
            return HTTPExtension.Verb.GET;
        case "POST":
            return HTTPExtension.Verb.POST;
        case "DELETE":
            return HTTPExtension.Verb.DELETE;
        case "PUT":
            return HTTPExtension.Verb.PUT;
        case "TRACE":
            return HTTPExtension.Verb.TRACE;
        case "CONNECT":
            return HTTPExtension.Verb.CONNECT;
        case "HEAD":
            return HTTPExtension.Verb.HEAD;
        case "NONE":
            return HTTPExtension.Verb.NONE;
        case "OPTIONS":
            return HTTPExtension.Verb.OPTIONS;
    }

    return HTTPExtension.Verb.NONE;
}