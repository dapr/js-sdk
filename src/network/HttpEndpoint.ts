import {Endpoint} from "./AbstractEndpoint";
import {URL} from "url";
import {URIParseConfig} from "./Network.util";

export class HttpEndpoint extends Endpoint {
    constructor(url: string) {
        super(url);

        try {
            this._parsedUrl = new URL(this.preprocessUri(url));
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