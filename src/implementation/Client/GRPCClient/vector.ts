/*
Copyright 2026 The Dapr Authors
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

import { create } from "@bufbuild/protobuf";
import IClientVector from "../../../interfaces/Client/IClientVector";
import * as Proto from "../../../proto/dapr/proto/runtime/v1/vector_pb";
import {
  VectorCreateCollectionOptions,
  VectorIndexingOptions,
  VectorOptions,
  VectorQuery,
  VectorRecord,
} from "../../../types/vector/Vector.types";
import { withAbortSignal } from "../../../utils/Client.util";
import {
  fromVectorAck,
  fromVectorBatch,
  fromVectorCollection,
  fromVectorQuery,
  fromVectorRecord,
  fromVectorUpsert,
  toBatchQueryVectorsRequest,
  toCreateCollectionRequest,
  toDeleteVectorsRequest,
  toGetVectorsRequest,
  toQueryVectorsRequest,
  toUpsertVectorsRequest,
  vectorCollectionRequest,
  vectorStoreRequest,
  vectorStrings,
} from "../../../utils/Vector.util";
import GRPCClient from "./GRPCClient";

export default class GRPCClientVector implements IClientVector {
  constructor(private readonly client: GRPCClient) {}

  async createCollection(storeName: string, collection: string, options: VectorCreateCollectionOptions): Promise<void> {
    const request = toCreateCollectionRequest(storeName, collection, options);
    const client = await this.getClient(options);
    await client.createCollectionAlpha1(request, { signal: options.signal });
  }

  async getCollection(storeName: string, collection: string, options?: VectorOptions) {
    const request = create(
      Proto.GetCollectionRequestAlpha1Schema,
      vectorCollectionRequest(storeName, collection, options),
    );
    const client = await this.getClient(options);
    return fromVectorCollection(await client.getCollectionAlpha1(request, { signal: options?.signal }));
  }

  async listCollections(storeName: string, options?: VectorOptions) {
    const request = create(Proto.ListCollectionsRequestAlpha1Schema, vectorStoreRequest(storeName, options));
    const client = await this.getClient(options);
    return vectorStrings((await client.listCollectionsAlpha1(request, { signal: options?.signal })).collections);
  }

  async deleteCollection(storeName: string, collection: string, options?: VectorOptions): Promise<void> {
    const request = create(
      Proto.DeleteCollectionRequestAlpha1Schema,
      vectorCollectionRequest(storeName, collection, options),
    );
    const client = await this.getClient(options);
    await client.deleteCollectionAlpha1(request, { signal: options?.signal });
  }

  async upsertVectors(
    storeName: string,
    collection: string,
    records: readonly VectorRecord[],
    options?: VectorIndexingOptions,
  ) {
    const request = toUpsertVectorsRequest(storeName, collection, records, options);
    const client = await this.getClient(options);
    return fromVectorUpsert(await client.upsertVectorsAlpha1(request, { signal: options?.signal }));
  }

  async getVectors(
    storeName: string,
    collection: string,
    ids: readonly string[],
    options?: VectorOptions & { includeValues?: boolean },
  ) {
    const request = toGetVectorsRequest(storeName, collection, ids, options);
    const client = await this.getClient(options);
    return (await client.getVectorsAlpha1(request, { signal: options?.signal })).records.map(fromVectorRecord);
  }

  async deleteVectors(storeName: string, collection: string, ids: readonly string[], options?: VectorIndexingOptions) {
    const request = toDeleteVectorsRequest(storeName, collection, ids, options);
    const client = await this.getClient(options);
    return fromVectorAck((await client.deleteVectorsAlpha1(request, { signal: options?.signal })).ack);
  }

  async queryVectors(storeName: string, collection: string, query: VectorQuery, options?: VectorOptions) {
    const request = toQueryVectorsRequest(storeName, collection, query, options);
    const client = await this.getClient(options);
    return fromVectorQuery(await client.queryVectorsAlpha1(request, { signal: options?.signal }));
  }

  async batchQueryVectors(
    storeName: string,
    collection: string,
    queries: readonly VectorQuery[],
    options?: VectorOptions,
  ) {
    const request = toBatchQueryVectorsRequest(storeName, collection, queries, options);
    const client = await this.getClient(options);
    return fromVectorBatch(
      await client.batchQueryVectorsAlpha1(request, { signal: options?.signal }),
      request.queries.length,
    );
  }

  private async getClient(options?: VectorOptions) {
    options?.signal?.throwIfAborted();
    const client = await withAbortSignal(this.client.getClient(), options?.signal);
    options?.signal?.throwIfAborted();
    return client;
  }
}
