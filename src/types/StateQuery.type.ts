import { Enumerable } from "./Enumerable.type"

export type StateQueryType = {
  filter: StateQueryFilter;
  sort: StateQuerySort[];
  pagination: StateQueryPagination;
}

type StateQuerySort = {
  key: string;
  order?: "ASC" | "DESC";
}

type StateQueryPagination = {
  limit: number;
  token?: string;
}

type StateQueryFilter = {
  // Operations
  AND?: Enumerable<StateQueryFilterInput>;
  OR?: Enumerable<StateQueryFilterInput>;
  EQ?: Enumerable<StateQueryFilterInput>;
  IN?: Enumerable<StateQueryFilterInput>;
}

type StateQueryFilterInput = {
  // Operations can be nested, so repeat here
  AND?: Enumerable<StateQueryFilterInput>;
  OR?: Enumerable<StateQueryFilterInput>;
  EQ?: Enumerable<StateQueryFilterInput>;
  IN?: Enumerable<StateQueryFilterInput>;

  // Next to that we can have the { key: value }
  [key: string]: any;
}