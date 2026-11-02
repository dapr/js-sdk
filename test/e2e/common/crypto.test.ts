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
import { pipeline } from "node:stream/promises";
import { buffer } from "node:stream/consumers";
import { Network, StartedNetwork } from "testcontainers";
import { DaprContainer, StartedDaprContainer } from "@dapr/testcontainer-node";
import { CommunicationProtocolEnum, DaprClient } from "../../../src";
import { EncryptRequest } from "../../../src/types/crypto/Requests";
import {
  buildCryptoLocalComponent,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";

describe("HTTP crypto", () => {
  let container: StartedDaprContainer | undefined;
  let network: StartedNetwork | undefined;
  let http: DaprClient;
  let grpc: DaprClient;
  const options: EncryptRequest = {
    componentName: "crypto-local",
    keyName: "symmetric256",
    keyWrapAlgorithm: "A256KW",
  };

  beforeAll(async () => {
    network = await new Network().start();
    container = await new DaprContainer(DAPR_TEST_RUNTIME_IMAGE)
      .withNetwork(network)
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE)
      .withEnvironment({ DAPR_API_TOKEN: "crypto-test-token" })
      .withComponent(buildCryptoLocalComponent())
      .start();
    http = new DaprClient({
      communicationProtocol: CommunicationProtocolEnum.HTTP,
      daprHost: container.getHost(),
      daprPort: String(container.getHttpPort()),
      daprApiToken: "crypto-test-token",
    });
    grpc = new DaprClient({
      communicationProtocol: CommunicationProtocolEnum.GRPC,
      daprHost: container.getHost(),
      daprPort: String(container.getGrpcPort()),
      daprApiToken: "crypto-test-token",
    });
  }, 180_000);

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      await http?.stop();
      await grpc?.stop();
      await container?.stop();
      await network?.stop();
    });
  }, 60_000);

  // Avoid overlapping decryptions with any crypto operation: https://github.com/dapr/kit/issues/170.
  it("round-trips empty input, UTF-8 strings and arbitrary binary bytes", async () => {
    for (const plaintext of [
      Buffer.alloc(0),
      "",
      "Hello \u00e9 \ud83c\udf0d",
      Buffer.from([0, 128, 255, 0, 123, 125]),
    ]) {
      const encrypted = await http.crypto.encrypt(plaintext, options);
      expect(Buffer.isBuffer(encrypted)).toBe(true);
      expect(encrypted.subarray(0, 15).toString("utf8")).toBe("dapr.io/enc/v1\n");
      expect(await http.crypto.decrypt(encrypted, { componentName: options.componentName })).toEqual(
        Buffer.from(plaintext),
      );
    }
  }, 30_000);

  it("round-trips ArrayBuffers and bounded typed-array and DataView slices", async () => {
    const bytes = Uint8Array.from([99, 0, 128, 255, 99]);
    for (const plaintext of [bytes.buffer.slice(1, 4), bytes.subarray(1, 4), new DataView(bytes.buffer, 1, 3)]) {
      const encrypted = await http.crypto.encrypt(plaintext, options);
      const padded = Uint8Array.from([99, ...encrypted, 99]);
      for (const ciphertext of [
        padded.buffer.slice(1, -1),
        padded.subarray(1, -1),
        new DataView(padded.buffer, 1, encrypted.length),
      ]) {
        expect(await http.crypto.decrypt(ciphertext, options)).toEqual(Buffer.from([0, 128, 255]));
      }
    }
  }, 30_000);

  it.each(["aes-gcm", "chacha20-poly1305"] as const)(
    "honors %s and omitted decryption key names",
    async (cipher) => {
      const plaintext = randomBytes(65536 + 37);
      const encrypted = await http.crypto.encrypt(plaintext, {
        ...options,
        dataEncryptionCipher: cipher,
        omitDecryptionKeyName: true,
      });
      await expect(http.crypto.decrypt(encrypted, { componentName: options.componentName })).rejects.toThrow();
      expect(await http.crypto.decrypt(encrypted, options)).toEqual(plaintext);
    },
    30_000,
  );

  it("embeds an alternate decryption key name and honors an explicit key override", async () => {
    const plaintext = Buffer.from("key reference override");
    const encrypted = await http.crypto.encrypt(plaintext, {
      ...options,
      omitDecryptionKeyName: false,
      decryptionKeyName: "missing-alias",
    });
    await expect(http.crypto.decrypt(encrypted, { componentName: options.componentName })).rejects.toThrow();
    expect(await http.crypto.decrypt(encrypted, options)).toEqual(plaintext);
  });

  it("streams multi-segment payloads with backpressure without overlapping encryption and decryption", async () => {
    const plaintext = randomBytes(1024 * 1024 + 137);
    const chunks: Buffer[] = [];
    for (let offset = 0; offset < plaintext.length; offset += 16384) {
      chunks.push(plaintext.subarray(offset, offset + 16384));
    }
    const encryptedChunks: Buffer[] = [];
    await pipeline(
      Readable.from(chunks),
      await http.crypto.encrypt(options),
      new Writable({
        highWaterMark: 1024,
        write(chunk, _encoding, callback) {
          encryptedChunks.push(Buffer.from(chunk));
          setImmediate(callback);
        },
      }),
    );
    const decrypted = await http.crypto.decrypt({ componentName: options.componentName });
    const result = buffer(decrypted);
    await pipeline(Readable.from(encryptedChunks), decrypted);
    expect(await result).toEqual(plaintext);
  }, 30_000);

  it("supports empty plaintext through the stream overloads", async () => {
    const encrypt = await http.crypto.encrypt(options);
    encrypt.end();
    const encrypted = await buffer(encrypt);
    const decrypt = await http.crypto.decrypt({ componentName: options.componentName });
    decrypt.end(encrypted);
    expect(await buffer(decrypt)).toEqual(Buffer.alloc(0));
  });

  it("exchanges multi-segment ciphertext between HTTP and gRPC in both directions", async () => {
    const plaintext = randomBytes(1024 * 1024 + 137);
    const fromHttp = await http.crypto.encrypt(plaintext, options);
    expect(await grpc.crypto.decrypt(fromHttp, options)).toEqual(plaintext);
    const fromGrpc = await grpc.crypto.encrypt(plaintext, options);
    expect(await http.crypto.decrypt(fromGrpc, options)).toEqual(plaintext);
  }, 30_000);

  it("encrypts concurrently, then decrypts each result sequentially due to dapr/kit#170", async () => {
    const plaintexts = Array.from({ length: 8 }, (_, i) => randomBytes(65536 + i * 137));
    const ciphertexts = await Promise.all(plaintexts.map((plaintext) => http.crypto.encrypt(plaintext, options)));
    for (let i = 0; i < ciphertexts.length; i++) {
      expect(await http.crypto.decrypt(ciphertexts[i], options)).toEqual(plaintexts[i]);
    }
  }, 30_000);

  it("surfaces missing components, missing keys and invalid or tampered ciphertext", async () => {
    await expect(http.crypto.encrypt("data", { ...options, componentName: "missing" })).rejects.toThrow();
    await expect(http.crypto.encrypt("data", { ...options, keyName: "missing" })).rejects.toThrow();
    await expect(http.crypto.decrypt(Buffer.from("not ciphertext"), options)).rejects.toThrow();
    const encrypted = await http.crypto.encrypt("authenticated plaintext", options);
    encrypted[encrypted.length - 1] ^= 255;
    await expect(http.crypto.decrypt(encrypted, options)).rejects.toThrow();

    const stream = await http.crypto.decrypt(options);
    stream.end(Buffer.from("not ciphertext"));
    await expect(buffer(stream)).rejects.toThrow();
  }, 30_000);
});
