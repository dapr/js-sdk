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

import type { IClientBinaryStore } from "../../src";

export async function readFirstChunkAndClose(chunks: AsyncIterable<Buffer>): Promise<Buffer> {
  const iterator = chunks[Symbol.asyncIterator]();
  if (!iterator.return) {
    throw new Error("Expected a closable Binary Store iterator");
  }
  try {
    const chunk = await iterator.next();
    if (chunk.done) {
      throw new Error("Expected a Binary Store chunk");
    }
    return chunk.value;
  } finally {
    await iterator.return();
  }
}

export async function expectPreAbortedOperationsToReject(
  binaryStore: IClientBinaryStore,
  controller: AbortController,
): Promise<void> {
  controller.abort();
  const options = { signal: controller.signal };
  const operations = [
    () => binaryStore.setBinaryFile("store", "file", Buffer.alloc(0), options),
    () => binaryStore.getBinaryFileBytes("store", "file", options),
    () => binaryStore.deleteBinaryFile("store", "file", options),
  ];
  for (const operation of operations) {
    await expect(operation()).rejects.toThrow();
  }
}
