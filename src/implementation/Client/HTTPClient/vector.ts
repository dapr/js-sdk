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

import { create, DescMessage, Message, toJson } from "@bufbuild/protobuf";
import IClientVector from "../../../interfaces/Client/IClientVector";
import * as Proto from "../../../proto/dapr/proto/runtime/v1/vector_pb";
import {
  VectorCreateCollectionOptions,
  VectorIndexingOptions,
  VectorOptions,
  VectorQuery,
  VectorRecord,
} from "../../../types/vector/Vector.types";
import { createHTTPQueryParam } from "../../../utils/Client.util";
import {
  fromVectorAck,
  fromVectorCollection,
  fromVectorHttpBatch,
  fromVectorHttpUpsert,
  fromVectorQuery,
  fromVectorRecord,
  parseVectorResponse,
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
import HTTPClient from "./HTTPClient";

export default class HTTPClientVector implements IClientVector {
  constructor(private readonly client: HTTPClient) {}

  async createCollection(storeName: string, collection: string, options: VectorCreateCollectionOptions): Promise<void> {
    const request = toCreateCollectionRequest(storeName, collection, options);
    await this.execute(Proto.CreateCollectionRequestAlpha1Schema, request, "POST", "", options);
  }

  async getCollection(storeName: string, collection: string, options?: VectorOptions) {
    const request = create(
      Proto.GetCollectionRequestAlpha1Schema,
      vectorCollectionRequest(storeName, collection, options),
    );
    const response = await this.execute(Proto.GetCollectionRequestAlpha1Schema, request, "GET", "", options);
    return fromVectorCollection(parseVectorResponse(Proto.GetCollectionResponseAlpha1Schema, response));
  }

  async listCollections(storeName: string, options?: VectorOptions) {
    const request = create(Proto.ListCollectionsRequestAlpha1Schema, vectorStoreRequest(storeName, options));
    const response = await this.execute(Proto.ListCollectionsRequestAlpha1Schema, request, "GET", "", options);
    return vectorStrings(parseVectorResponse(Proto.ListCollectionsResponseAlpha1Schema, response).collections);
  }

  async deleteCollection(storeName: string, collection: string, options?: VectorOptions): Promise<void> {
    const request = create(
      Proto.DeleteCollectionRequestAlpha1Schema,
      vectorCollectionRequest(storeName, collection, options),
    );
    await this.execute(Proto.DeleteCollectionRequestAlpha1Schema, request, "DELETE", "", options);
  }

  async upsertVectors(
    storeName: string,
    collection: string,
    records: readonly VectorRecord[],
    options?: VectorIndexingOptions,
  ) {
    const request = toUpsertVectorsRequest(storeName, collection, records, options);
    return fromVectorHttpUpsert(
      await this.execute(Proto.UpsertVectorsRequestAlpha1Schema, request, "POST", "/vectors", options),
    );
  }

  async getVectors(
    storeName: string,
    collection: string,
    ids: readonly string[],
    options?: VectorOptions & { includeValues?: boolean },
  ) {
    const request = toGetVectorsRequest(storeName, collection, ids, options);
    const response = await this.execute(Proto.GetVectorsRequestAlpha1Schema, request, "POST", "/vectors/get", options);
    return parseVectorResponse(Proto.GetVectorsResponseAlpha1Schema, response).records.map(fromVectorRecord);
  }

  async deleteVectors(storeName: string, collection: string, ids: readonly string[], options?: VectorIndexingOptions) {
    const request = toDeleteVectorsRequest(storeName, collection, ids, options);
    const response = await this.execute(
      Proto.DeleteVectorsRequestAlpha1Schema,
      request,
      "POST",
      "/vectors/delete",
      options,
    );
    return fromVectorAck(parseVectorResponse(Proto.DeleteVectorsResponseAlpha1Schema, response).ack);
  }

  async queryVectors(storeName: string, collection: string, query: VectorQuery, options?: VectorOptions) {
    const request = toQueryVectorsRequest(storeName, collection, query, options);
    const response = await this.execute(Proto.QueryVectorsRequestAlpha1Schema, request, "POST", "/query", options);
    return fromVectorQuery(parseVectorResponse(Proto.QueryVectorsResponseAlpha1Schema, response));
  }

  async batchQueryVectors(
    storeName: string,
    collection: string,
    queries: readonly VectorQuery[],
    options?: VectorOptions,
  ) {
    const request = toBatchQueryVectorsRequest(storeName, collection, queries, options);
    const response = await this.execute(
      Proto.BatchQueryVectorsRequestAlpha1Schema,
      request,
      "POST",
      "/batch-query",
      options,
    );
    return fromVectorHttpBatch(response, request.queries.length);
  }

  private async execute(
    schema: DescMessage,
    request: Message & { storeName: string; collection?: string; metadata: Record<string, string> },
    method: "GET" | "POST" | "DELETE",
    suffix: string,
    options?: VectorOptions,
  ): Promise<unknown> {
    let path = `/vector/${encodeURIComponent(request.storeName)}/collections`;
    if (request.collection !== undefined) {
      path += `/${encodeURIComponent(request.collection)}`;
    }
    path += suffix;
    if (method !== "POST") {
      const query = createHTTPQueryParam({ data: request.metadata, type: "metadata" });
      return this.client.executeWithApiVersion("v1.0-alpha1", query ? `${path}?${query}` : path, {
        method,
        signal: options?.signal,
      });
    }
    const body = toJson(schema, request);
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      throw new TypeError("Vector request must encode to a JSON object");
    }
    delete body.storeName;
    delete body.collection;
    return this.client.executeWithApiVersion("v1.0-alpha1", path, { method, body, signal: options?.signal });
  }
}
