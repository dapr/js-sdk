import fetch from "node-fetch";
import IClient from "../../../interfaces/Client/IClient";

export default class HTTPClient implements IClient {
    isInitialized: boolean;
    client: typeof fetch;
    clientHost: string;
    clientPort: string;
    clientUrl: string;

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

    async execute(url: string, params?: any): Promise<any> {
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

        return await fetch(`${this.clientUrl}${url}`, params);
    }
}