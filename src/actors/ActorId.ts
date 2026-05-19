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

import { randomUUID } from "crypto";

/**
 * Represents the unique identity of an actor instance.
 *
 * ActorId encapsulates the identity semantics for actors, providing:
 * - Explicit ID creation for deterministic actor references
 * - Generated ID creation for cases where identity need not be specified
 * - URL-safe serialization for transport over HTTP/REST
 * - Stable equality semantics based on the underlying ID string
 *
 * Actor IDs are immutable and must be non-empty strings. They serve as the
 * primary key for actor identity within a given actor type.
 *
 * @example
 * ```typescript
 * // Create with explicit ID
 * const accountId = new ActorId("user-123");
 *
 * // Create with generated UUID
 * const sessionId = ActorId.createRandomId();
 *
 * // Get string representation
 * const idStr = accountId.getId(); // "user-123"
 *
 * // Get URL-safe representation (for HTTP transport)
 * const urlSafe = accountId.getURLSafeId(); // "user-123" (or "user%20123" if spaces present)
 * ```
 */
export default class ActorId {
  private readonly id: string;

  /**
   * Constructs an ActorId with an explicit identifier.
   *
   * @param id - A non-empty string that uniquely identifies the actor instance within its actor type.
   *             Can contain any string data, but will be URL-encoded for HTTP transport.
   * @throws {Error} If id is empty or falsy.
   *
   * @example
   * ```typescript
   * const accountId = new ActorId("account-abc-123");
   * const sessionId = new ActorId("session::xyz");
   * ```
   */
  constructor(id: string) {
    if (!id) {
      throw new Error("ActorId cannot be empty");
    }
    this.id = id;
  }

  /**
   * Generates a new ActorId with a random UUID v4 identifier.
   *
   * Useful for scenarios where actor identity does not need to be deterministic
   * or application-assigned.
   *
   * @returns A new ActorId with a randomly generated UUID string.
   *
   * @example
   * ```typescript
   * const transactionId = ActorId.createRandomId(); // e.g., "550e8400-e29b-41d4-a716-446655440000"
   * ```
   */
  static createRandomId(): ActorId {
    return new ActorId(randomUUID());
  }

  /**
   * Retrieves the underlying identifier string.
   *
   * This returns the raw ID as provided during construction, without any encoding.
   *
   * @returns The actor's identifier string.
   */
  getId() {
    return this.id;
  }

  /**
   * Retrieves the URL-safe (percent-encoded) representation of this actor ID.
   *
   * This encoding is suitable for use in HTTP request paths and query parameters.
   * Special characters are percent-encoded according to RFC 3986.
   *
   * @returns The actor ID with special characters percent-encoded.
   *
   * @example
   * ```typescript
   * const id = new ActorId("user@domain.com");
   * id.getURLSafeId(); // "user%40domain.com"
   * ```
   */
  getURLSafeId() {
    return encodeURIComponent(this.id);
  }

  /**
   * Retrieves the string representation of this actor ID.
   *
   * Equivalent to {@link getId}, returns the unencoded identifier.
   *
   * @returns The actor's identifier string.
   */
  toString() {
    return this.id;
  }
}
