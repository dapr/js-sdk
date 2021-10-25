export interface DaprInvokerCallbackContentMetadata {
  contentType?: string;
}

export interface DaprInvokerCallbackContent {
  body?: string;
  query?: string;
  metadata?: DaprInvokerCallbackContentMetadata
}

export type TypeDaprInvokerCallback = (data: DaprInvokerCallbackContent) => Promise<any | void>;