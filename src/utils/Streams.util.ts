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

import { Readable } from "node:stream";
import { ClientReadableStream } from "@grpc/grpc-js";

import { StreamPayload } from "../proto/dapr/proto/common/v1/common_pb";

interface messageWithPayload {
  getPayload(): StreamPayload | undefined;
}

/**
 * DaprChunkedStream is a Readable stream that processes data sent from Dapr over a gRPC stream, chunked.
 */
export class DaprChunkedStream extends Readable {
  private grpcStream: ClientReadableStream<messageWithPayload>;

  constructor(grpcStream: ClientReadableStream<messageWithPayload>) {
    super({
      objectMode: false,
      emitClose: true,
    });

    this.grpcStream = grpcStream;

    let seq = 0;
    this.grpcStream.on("data", (chunk: messageWithPayload) => {
      const payload = chunk.getPayload();
      if (!payload) {
        return;
      }

      // Check sequence
      if (payload.getSeq() != seq) {
        this.closeWithError(new Error(`Invalid payload sequence: got ${payload.getSeq()} but expected ${seq}`));
        return;
      }
      seq++;

      // Push the data into the internal buffer
      const data = payload.getData_asU8();
      if (!this.push(data)) {
        // If push() returns false, then return an error
        this.closeWithError(new Error("Received an error while pushing data to the callers"));
        return;
      }
    });
    this.grpcStream.on("end", () => {
      // Push a null value to signal EOF
      this.push(null);
    });
    this.grpcStream.on("error", (err) => {
      this.closeWithError(err);
    });
  }

  private closeWithError(err: Error) {
    this.grpcStream.cancel();
    this.destroy(err);
  }

  _read() {
    // Nop - we use push() to push data to readers.
    // However, we still need to implement this method, even if as a stub.
  }
}
