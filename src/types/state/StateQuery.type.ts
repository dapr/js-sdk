/*
Copyright 2022 The Dapr Authors
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

import { Enumerable } from "../common/Enumerable.type";

export type StateQueryType = {
  filter: StateQueryFilter;
  sort: StateQuerySort[];
  page: StateQueryPagination;
};

type StateQuerySort = {
  key: string;
  order?: "ASC" | "DESC";
};

type StateQueryPagination = {
  limit: number;
  token?: string;
};

type StateQueryFilter = {
  // Operations
  AND?: Enumerable<StateQueryFilterInput>;
  OR?: Enumerable<StateQueryFilterInput>;
  EQ?: Enumerable<StateQueryFilterInput>;
  IN?: Enumerable<StateQueryFilterInput>;
};

type StateQueryFilterInput = {
  // Operations can be nested, so repeat here
  AND?: Enumerable<StateQueryFilterInput>;
  OR?: Enumerable<StateQueryFilterInput>;
  EQ?: Enumerable<StateQueryFilterInput>;
  IN?: Enumerable<StateQueryFilterInput>;

  // Next to that we can have the { key: value }
  [key: string]: any;
};
