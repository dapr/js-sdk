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

import { GRPCNotSupportedError } from "../../../errors/GRPCNotSupportedError";
import IClientSearch from "../../../interfaces/Client/IClientSearch";
import {
  IndexAck,
  IndexDocumentsResult,
  SearchDocument,
  SearchIndex,
  SearchResult,
} from "../../../types/search/Search.types";

export default class GRPCClientSearch implements IClientSearch {
  async createIndex(): Promise<void> {
    throw new GRPCNotSupportedError();
  }

  async getIndex(): Promise<SearchIndex> {
    throw new GRPCNotSupportedError();
  }

  async listIndexes(): Promise<string[]> {
    throw new GRPCNotSupportedError();
  }

  async deleteIndex(): Promise<void> {
    throw new GRPCNotSupportedError();
  }

  async indexDocuments(): Promise<IndexDocumentsResult> {
    throw new GRPCNotSupportedError();
  }

  async getDocuments<T = unknown>(): Promise<SearchDocument<T>[]> {
    throw new GRPCNotSupportedError();
  }

  async deleteDocuments(): Promise<IndexAck> {
    throw new GRPCNotSupportedError();
  }

  async search<T = unknown>(): Promise<SearchResult<T>> {
    throw new GRPCNotSupportedError();
  }
}
