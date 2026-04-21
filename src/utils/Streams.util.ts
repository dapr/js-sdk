/*
Copyright 2023 The Dapr Authors
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

import { Duplex } from "node:stream";

import { StreamPayload } from "../proto/dapr/proto/common/v1/common_pb";

interface MessageWithPayload {
  payload?: StreamPayload;
}

/**
 * DeferredAsyncIterable allows pushing values into an async iterable from outside.
 */
export class DeferredAsyncIterable<T> implements AsyncIterable<T> {
  private queue: T[] = [];
  private resolve?: () => void;
  private done = false;

  push(value: T): void {
    this.queue.push(value);
    this.resolve?.();
    this.resolve = undefined;
  }

  end(): void {
    this.done = true;
    this.resolve?.();
    this.resolve = undefined;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T> {
    while (true) {
      if (this.queue.length > 0) {
        yield this.queue.shift()!;
      } else if (this.done) {
        return;
      } else {
        await new Promise<void>((r) => {
          this.resolve = r;
        });
      }
    }
  }
}

/**
 * DaprChunkedStream is a Duplex stream that bridges Node.js stream I/O to ConnectRPC
 * bidi-streaming calls. Write data to it; read the encrypted/decrypted output back.
 */
export class DaprChunkedStream<T, U extends MessageWithPayload> extends Duplex {
  private readonly pusher: DeferredAsyncIterable<T>;
  private writeSeq = 0;
  private readonly createMessage: (data: Uint8Array, seq: number) => T;

  constructor(
    pusher: DeferredAsyncIterable<T>,
    responseIterable: AsyncIterable<U>,
    createMessage: (data: Uint8Array, seq: number) => T,
  ) {
    super({ objectMode: false, emitClose: true });

    this.pusher = pusher;
    this.createMessage = createMessage;

    this._readResponseStream(responseIterable);
  }

  private async _readResponseStream(responseIterable: AsyncIterable<U>): Promise<void> {
    try {
      for await (const response of responseIterable) {
        const data = response.payload?.data;
        if (data?.length) {
          this.push(Buffer.from(data));
        }
      }
    } catch (e) {
      this.destroy(e as Error);
      return;
    }
    this.push(null);
  }

  _read(): void {
    // Data is pushed by _readResponseStream; nothing to do here.
  }

  _write(chunk: Buffer | string, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    if (!chunk?.length) {
      callback();
      return;
    }

    if (typeof chunk === "string") {
      chunk = Buffer.from(chunk, encoding);
    }

    // Send data in 2KB chunks
    const chunkSize = 2 << 10;
    for (let n = 0; n < chunk.length; n += chunkSize) {
      const data = chunk.subarray(n, n + chunkSize);
      this.pusher.push(this.createMessage(data, this.writeSeq++));
    }

    callback();
  }

  _final(callback: (error?: Error | null | undefined) => void): void {
    this.pusher.end();
    callback();
  }
}
