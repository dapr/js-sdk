export type StateQueryResponseType = {
  results: StateQueryResponseResult[]
  token?: string;
}

type StateQueryResponseResult = {
  key: string;
  data: any; // byte array
  etag?: string;
  error?: string;
}