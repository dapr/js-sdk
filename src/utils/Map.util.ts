import { Map } from 'google-protobuf';
import { IRequestMetadata } from '../types/RequestMetadata.type';

export function merge(metadataMap: Map<string, string>, metadata: IRequestMetadata): void {
  for (const key of Object.keys(metadata)) {
    metadataMap.set(key, metadata[key]);
  }
}
