import {URL} from "url";

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