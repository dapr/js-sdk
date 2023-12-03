export class URIParseConfig {
    static readonly DEFAULT_SCHEME_GRPC = "dns";
    static readonly DEFAULT_SCHEME_HTTP = "http";
    static readonly DEFAULT_HOSTNAME = "localhost";
    static readonly DEFAULT_PORT = 443;
    static readonly DEFAULT_AUTHORITY = "";
    static readonly ACCEPTED_SCHEMES_GRPC = ["dns", "unix", "unix-abstract", "vsock", "http", "https", "grpc", "grpcs"];
}