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
import { ClientDuplexStream } from "@grpc/grpc-js";

import { StreamPayload } from "../proto/dapr/proto/common/v1/common_pb";

interface messageWithPayload {
  getPayload(): StreamPayload | undefined;
  setPayload(value?: StreamPayload): unknown;
}

/**
 * DaprChunkedStream is a Readable stream that processes data sent from Dapr over a gRPC stream, chunked.
 */
export class DaprChunkedStream<T extends messageWithPayload, U extends messageWithPayload> extends Duplex {
  private grpcStream: ClientDuplexStream<T, U>;
  private reqFactory: { new (): T };
  private setReqOptionsFn: (req: T) => void;
  private writeSeq = 0;
  private readSeq = 0;

  constructor(grpcStream: ClientDuplexStream<T, U>, reqFactory: { new (): T }, setReqOptionsFn: (req: T) => void) {
    super({
      objectMode: false,
      emitClose: true,
    });

    this.grpcStream = grpcStream;
    this.reqFactory = reqFactory;
    this.setReqOptionsFn = setReqOptionsFn;
  }

  _read(): void {
    // Attach the handlers if they haven't been attached already
    if (this.grpcStream.listenerCount("data") == 0) {
      this.readGrpcStream();
    } else if (this.grpcStream.isPaused()) {
      // Resume the stream if it's paused
      this.grpcStream.resume();
    }
  }

  _write(chunk: Buffer | string, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    if (!chunk?.length) {
      // Nothing to process if there's no data
      callback();
      return;
    }

    // Ensure chunk is a Buffer
    if (typeof chunk == "string") {
      chunk = Buffer.from(chunk, encoding);
    }

    // Read data from the input stream, in chunks of up to 2KB
    // Send the data until we reach the end of the input stream
    for (let n = 0; n < chunk.length; n += 2 << 10) {
      const req = new this.reqFactory();

      // If this is the first chunk, add the options
      if (this.writeSeq == 0) {
        this.setReqOptionsFn(req);
      }

      // Add the payload
      const reqPayload = new StreamPayload();
      // From the Node.js docs: "Specifying end greater than buf.length will return the same result as that of end equal to buf.length."
      reqPayload.setData(chunk.subarray(n, n + (2 << 10)));
      reqPayload.setSeq(this.writeSeq);
      req.setPayload(reqPayload);
      this.writeSeq++;

      // Send the chunk
      this.grpcStream.write(req);
    }

    callback();
  }

  _final(callback: (error?: Error | null | undefined) => void): void {
    // When the write part of the stream is done, signal that no more data will be sent to the server
    this.grpcStream.end();
    callback();
  }

  private readGrpcStream() {
    let readSeq = 0;

    this.grpcStream.on("data", (chunk: messageWithPayload) => {
      const payload = chunk.getPayload();
      if (!payload) {
        return;
      }

      // Check sequence
      if (payload.getSeq() != readSeq) {
        this.closeWithError(new Error(`Invalid payload sequence: got ${payload.getSeq()} but expected ${readSeq}`));
        return;
      }
      readSeq++;

      // Push the data into the internal buffer
      const data = payload.getData_asU8();
      if (!this.push(data)) {
        // If push() returns false, we need to pause reading the stream
        this.grpcStream.pause();
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
}
