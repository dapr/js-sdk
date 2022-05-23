import http from "http";
import https from "https";

export type THTTPExecuteParams = {
  body?: string;
  headers?: { [key: string]: any };
  method: string;
  agent?: http.Agent | https.Agent;
}