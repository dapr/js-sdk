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

import { randomBytes } from "node:crypto";
import { Readable, Writable } from "node:stream";
import { Network, StartedNetwork } from "testcontainers";
import { BinaryStoreHarness, Component, DaprContainer, StartedDaprContainer } from "@dapr/testcontainer-node";
import { CommunicationProtocolEnum, DaprClient } from "../../../src";
import {
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";
import { DAPR_TEST_VERSION, evaluateMinimumDaprRuntime } from "../helpers/runtimeVersion";
import { readFirstChunkAndClose } from "../../utils/BinaryStoreTestUtils";

const gate = evaluateMinimumDaprRuntime("1.19.0", DAPR_TEST_VERSION);
const describeBinaryStore = gate.supported ? describe : describe.skip;

describeBinaryStore(`Binary Store (${gate.reason ?? DAPR_TEST_VERSION})`, () => {
  let container: StartedDaprContainer | undefined;
  let network: StartedNetwork | undefined;
  const clients: DaprClient[] = [];

  beforeAll(async () => {
    network = await new Network().start();
    container = await new DaprContainer(DAPR_TEST_RUNTIME_IMAGE)
      .withNetwork(network)
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE)
      .withEnvironment({ DAPR_API_TOKEN: "binary-store-test-token" })
      .withComponent(
        new Component("binarystore", "binarystore.in-memory", "v1", [
          { name: "maxSize", value: "8Mi" },
          { name: "maxTotalSize", value: "32Mi" },
        ]),
      )
      .start();
    for (const protocol of [CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC]) {
      clients.push(
        new DaprClient({
          communicationProtocol: protocol,
          daprHost: container.getHost(),
          daprPort: String(
            protocol === CommunicationProtocolEnum.HTTP ? container.getHttpPort() : container.getGrpcPort(),
          ),
          daprApiToken: "binary-store-test-token",
        }),
      );
    }
  }, 180_000);

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      await Promise.all(clients.map((client) => client.stop()));
      await container?.stop();
      await network?.stop();
    });
  }, 60_000);

  describe.each([
    ["HTTP", CommunicationProtocolEnum.HTTP],
    ["gRPC", CommunicationProtocolEnum.GRPC],
  ] as const)("%s", (_name, protocol) => {
    let client: DaprClient;
    beforeEach(() => {
      const index = protocol === CommunicationProtocolEnum.HTTP ? 0 : 1;
      client = clients[index];
    });

    it("round-trips empty files and arbitrary non-UTF-8 bytes across protocols", async () => {
      const other = clients[protocol === CommunicationProtocolEnum.HTTP ? 1 : 0];
      for (const bytes of [Buffer.alloc(0), Buffer.from([0, 128, 255, 0, 123, 125])]) {
        const name = `${protocol}-bytes-${bytes.length}`;
        await client.binaryStore.setBinaryFile("binarystore", name, bytes);
        expect(await other.binaryStore.getBinaryFileBytes("binarystore", name)).toEqual(bytes);
        await other.binaryStore.deleteBinaryFile("binarystore", name);
        await expect(client.binaryStore.getBinaryFileBytes("binarystore", name)).rejects.toThrow();
      }
    });

    it("streams files larger than the default RPC message limit without losing bytes", async () => {
      const bytes = randomBytes(4 * 1024 * 1024 + 321);
      const name = `${protocol}-large.bin`;
      await expect(
        client.binaryStore.setBinaryFile("binarystore", name, Readable.from([bytes]), { chunkSize: 16384 }),
      ).resolves.toBeUndefined();
      const chunks: Buffer[] = [];
      const destination = new Writable({
        highWaterMark: 1024,
        write(chunk, _encoding, callback) {
          chunks.push(Buffer.from(chunk));
          setImmediate(callback);
        },
      });
      await expect(client.binaryStore.getBinaryFile("binarystore", name, destination)).resolves.toBeUndefined();
      expect(Buffer.concat(chunks).equals(bytes)).toBe(true);
      expect(destination.writableFinished).toBe(true);
      await client.binaryStore.deleteBinaryFile("binarystore", name);
    }, 90_000);

    it("fails on duplicates unless overwrite is explicit, including empty replacements", async () => {
      const name = `${protocol}-overwrite`;
      await client.binaryStore.setBinaryFile("binarystore", name, Buffer.from([1]));
      await expect(client.binaryStore.setBinaryFile("binarystore", name, Buffer.from([2]))).rejects.toThrow();
      expect(await client.binaryStore.getBinaryFileBytes("binarystore", name)).toEqual(Buffer.from([1]));
      await client.binaryStore.setBinaryFile("binarystore", name, Buffer.from([0, 255]), { overwrite: true });
      expect(await client.binaryStore.getBinaryFileBytes("binarystore", name)).toEqual(Buffer.from([0, 255]));
      await client.binaryStore.setBinaryFile("binarystore", name, Buffer.alloc(0), { overwrite: true });
      expect(await client.binaryStore.getBinaryFileBytes("binarystore", name)).toEqual(Buffer.alloc(0));
      await client.binaryStore.deleteBinaryFile("binarystore", name);
    });

    it("preserves nested names, spaces, percent signs, and Unicode", async () => {
      const name = `${protocol}/nested/file % \u00e9.bin`;
      const bytes = randomBytes(98321);
      await client.binaryStore.setBinaryFile("binarystore", name, bytes);
      const chunks: Buffer[] = [];
      for await (const chunk of client.binaryStore.getBinaryFileChunks("binarystore", name)) {
        chunks.push(chunk);
      }
      expect(Buffer.concat(chunks).equals(bytes)).toBe(true);
      await client.binaryStore.deleteBinaryFile("binarystore", name);
    });

    it("surfaces missing files, missing stores, and component size limits", async () => {
      await expect(client.binaryStore.getBinaryFileBytes("binarystore", "missing")).rejects.toThrow();
      await expect(client.binaryStore.deleteBinaryFile("binarystore", "missing")).rejects.toThrow();
      await expect(client.binaryStore.setBinaryFile("missing", "file", Buffer.alloc(1))).rejects.toThrow();
      await expect(client.binaryStore.getBinaryFileBytes("missing", "file")).rejects.toThrow();
      await expect(client.binaryStore.deleteBinaryFile("missing", "file")).rejects.toThrow();
      await expect(
        client.binaryStore.setBinaryFile("binarystore", `${protocol}-oversized`, Buffer.alloc(8 * 1024 * 1024 + 1)),
      ).rejects.toThrow();
    }, 30_000);

    it("cancels an upload while the input stream is waiting for more data", async () => {
      const controller = new AbortController();
      let consumed!: () => void;
      const started = new Promise<void>((resolve) => {
        consumed = resolve;
      });
      const source = new Readable({
        read() {
          this.push(Buffer.from([1]));
          consumed();
          this._read = () => {};
        },
      });
      const upload = client.binaryStore.setBinaryFile("binarystore", `${protocol}-cancelled`, source, {
        signal: controller.signal,
      });
      const rejected = expect(upload).rejects.toThrow();
      await started;
      controller.abort();
      await rejected;
      expect(source.destroyed).toBe(true);
    });

    it("cancels downloads and permits early exit without affecting subsequent reads", async () => {
      const name = `${protocol}-download-cancellation`;
      const bytes = randomBytes(128 * 1024);
      await client.binaryStore.setBinaryFile("binarystore", name, bytes);
      const controller = new AbortController();
      const chunks = client.binaryStore.getBinaryFileChunks("binarystore", name, { signal: controller.signal });
      const iterator = chunks[Symbol.asyncIterator]();
      expect((await iterator.next()).done).toBe(false);
      controller.abort();
      await expect(iterator.next()).rejects.toThrow();
      const firstChunk = await readFirstChunkAndClose(client.binaryStore.getBinaryFileChunks("binarystore", name));
      expect(firstChunk.length).toBeGreaterThan(0);
      const downloaded = await client.binaryStore.getBinaryFileBytes("binarystore", name);
      expect(downloaded.equals(bytes)).toBe(true);
      await client.binaryStore.deleteBinaryFile("binarystore", name);
    });
  });
});

describeBinaryStore(`Binary Store harness (${gate.reason ?? DAPR_TEST_VERSION})`, () => {
  let harness: BinaryStoreHarness;
  const clients: DaprClient[] = [];

  beforeAll(async () => {
    harness = new BinaryStoreHarness({
      daprRuntimeImage: DAPR_TEST_RUNTIME_IMAGE,
      binaryStoreName: "binary-store-harness",
      maxSize: "8Mi",
      maxTotalSize: "32Mi",
    });
    harness
      .getDaprContainer()
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE);
    await harness.start();

    // Exercise this checkout, not the published SDK used by harness.createDaprClient().
    for (const protocol of [CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC]) {
      clients.push(
        new DaprClient({
          communicationProtocol: protocol,
          daprHost: harness.getHost(),
          daprPort: String(protocol === CommunicationProtocolEnum.HTTP ? harness.getHttpPort() : harness.getGrpcPort()),
        }),
      );
    }
  }, 180_000);

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      try {
        await Promise.all(clients.map((client) => client.stop()));
      } finally {
        await harness?.stop();
      }
    });
  }, 60_000);

  describe.each([
    ["HTTP", CommunicationProtocolEnum.HTTP],
    ["gRPC", CommunicationProtocolEnum.GRPC],
  ] as const)("%s", (_name, protocol) => {
    let client: DaprClient;
    let storeName: string;

    beforeEach(() => {
      client = clients[protocol === CommunicationProtocolEnum.HTTP ? 0 : 1];
      storeName = harness.getBinaryStoreName();
    });

    it("reads harness-seeded binary files through every download API", async () => {
      const name = `${protocol}/seeded file % \u00e9.bin`;
      const bytes = Buffer.from([0, 128, 255, 0, 123, 125]);
      await harness.setBinaryFile(name, bytes);

      expect(await client.binaryStore.getBinaryFileBytes(storeName, name)).toEqual(bytes);
      const chunks: Buffer[] = [];
      for await (const chunk of client.binaryStore.getBinaryFileChunks(storeName, name)) {
        chunks.push(chunk);
      }
      expect(Buffer.concat(chunks)).toEqual(bytes);

      const written: Buffer[] = [];
      const destination = new Writable({
        write(chunk, _encoding, callback) {
          written.push(Buffer.from(chunk));
          callback();
        },
      });
      await client.binaryStore.getBinaryFile(storeName, name, destination);
      expect(Buffer.concat(written)).toEqual(bytes);
      expect(destination.writableFinished).toBe(true);
      await harness.deleteBinaryFile(name);
    });

    it("uploads a multi-chunk stream larger than 4 MiB that the harness can read unchanged", async () => {
      const name = `${protocol}-harness-stream.bin`;
      const bytes = randomBytes(4 * 1024 * 1024 + 321);
      const source = Readable.from(
        (async function* () {
          for (let offset = 0; offset < bytes.length; offset += 65537) {
            yield bytes.subarray(offset, offset + 65537);
          }
        })(),
      );
      await client.binaryStore.setBinaryFile(storeName, name, source, { chunkSize: 16384 });
      const uploaded = await harness.getBinaryFile(name);
      expect(uploaded.equals(bytes)).toBe(true);
      await harness.deleteBinaryFile(name);
    }, 90_000);

    it("enforces create, overwrite, and delete semantics against harness-managed files", async () => {
      const name = `${protocol}-harness-lifecycle.bin`;
      const original = Buffer.from([0, 128, 255]);
      await harness.setBinaryFile(name, original, false);
      await expect(client.binaryStore.setBinaryFile(storeName, name, Buffer.from([1]))).rejects.toThrow();
      expect(await harness.getBinaryFile(name)).toEqual(original);

      const backing = Uint8Array.from([99, 0, 255, 128, 99]);
      await client.binaryStore.setBinaryFile(storeName, name, backing.subarray(1, 4), { overwrite: true });
      expect(await harness.getBinaryFile(name)).toEqual(Buffer.from([0, 255, 128]));
      await client.binaryStore.setBinaryFile(storeName, name, Buffer.alloc(0), { overwrite: true });
      expect(await harness.getBinaryFile(name)).toEqual(Buffer.alloc(0));

      await client.binaryStore.deleteBinaryFile(storeName, name);
      await expect(harness.getBinaryFile(name)).rejects.toThrow();
      await client.binaryStore.setBinaryFile(storeName, name, original);
      expect(await harness.getBinaryFile(name)).toEqual(original);
      await harness.deleteBinaryFile(name);
      await expect(client.binaryStore.getBinaryFileBytes(storeName, name)).rejects.toThrow();
    });
  });
});
