import { IEtag } from "./Etag.type";
import { IRequestMetadata } from "./RequestMetadata.type";
import { IStateOptions } from "./StateOptions.type";

export type IRequest = {
  key: string;
  value?: string;
  etag?: IEtag;
  metadata?: IRequestMetadata;
  options?: IStateOptions;
}