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

/**
 * Header daprd sends on actor calls when reentrancy is enabled.
 * Same name and casing as Dapr.Actors `Constants.ReentrancyRequestHeaderName`.
 * Express stores it case-insensitively; look it up with this canonical name.
 */
export const DAPR_REENTRANCY_ID_HEADER = "Dapr-Reentrancy-Id";

/**
 * Empty ids do not identify a call chain. Matches `string.IsNullOrEmpty` in the .NET turn lock.
 */
export function normalizeReentrancyId(reentrancyId: string | undefined | null): string | undefined {
  if (reentrancyId == null || reentrancyId.length === 0) {
    return undefined;
  }
  return reentrancyId;
}

/**
 * Reads `Dapr-Reentrancy-Id` from a header value. Repeated headers use the first value.
 */
export function reentrancyIdFromHeaderValue(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return normalizeReentrancyId(raw);
}

type TurnWaiter = {
  reentrancyId: string | undefined;
  grant: () => void;
};

/**
 * One actor id's turn. `activeCalls` is the nested depth of the current chain.
 * The map entry is removed only when `references` hits zero, and waiters hold a
 * reference, so an idle id cannot be deleted out from under a queued call.
 */
class TurnEntry {
  references = 0;
  activeCalls = 0;
  reentrancyId: string | undefined = undefined;
  reentrancyAllowed = false;
  waiters: TurnWaiter[] = [];
}

/**
 * Held for the whole actor invocation, including activation and the post-method state save.
 * Releasing it is what lets the next turn start. Dropping the HTTP request does not.
 */
export class ActorTurnLease {
  private owner: ActorTurnLock | undefined;

  constructor(owner: ActorTurnLock, private readonly actorId: string, private readonly entry: TurnEntry) {
    this.owner = owner;
  }

  /**
   * Opens the turn to the same call chain. Activation must finish before this runs,
   * so a matching id cannot re-enter while `onActivate` is still executing.
   */
  allowReentrancy(): void {
    this.owner?.allowReentrancy(this.entry);
  }

  release(): void {
    const owner = this.owner;
    this.owner = undefined;
    owner?.release(this.actorId, this.entry);
  }
}

/**
 * Per-actor turn gate.
 *
 * The sidecar can stop waiting before actor code finishes. Keep local ownership until
 * every invocation in the turn has completed, not until its request is cancelled.
 *
 * At most one turn runs for an actor id. A call may join that turn only when reentrancy
 * was explicitly allowed and its non-empty reentrancy id equals the active turn's id.
 * Nested frames share the turn. The next queued caller runs only when the depth returns
 * to zero. Non-matching waiters are granted FIFO. A matching reentrant call may pass
 * them; otherwise a different chain sitting at the head of the queue would deadlock it.
 */
export default class ActorTurnLock {
  private readonly entries = new Map<string, TurnEntry>();

  /** Actor ids that still have a turn entry. Idle ids are removed. */
  get size(): number {
    return this.entries.size;
  }

  async acquire(actorId: string, reentrancyId?: string | null): Promise<ActorTurnLease> {
    const normalized = normalizeReentrancyId(reentrancyId);
    let entry = this.entries.get(actorId);
    if (entry === undefined) {
      entry = new TurnEntry();
      this.entries.set(actorId, entry);
    }

    const current = entry;
    current.references += 1;

    try {
      if (this.tryEnter(current, normalized)) {
        return new ActorTurnLease(this, actorId, current);
      }

      await new Promise<void>((resolve) => {
        current.waiters.push({ reentrancyId: normalized, grant: resolve });
      });

      // The granter already took this frame's depth slot. Do not enter again.
      return new ActorTurnLease(this, actorId, current);
    } catch (error) {
      this.releaseReference(actorId, current);
      throw error;
    }
  }

  allowReentrancy(entry: TurnEntry): void {
    // A turn with no reentrancy id (reentrancy disabled, or the header was absent) stays exclusive.
    if (!entry.reentrancyAllowed && entry.reentrancyId !== undefined) {
      entry.reentrancyAllowed = true;
      this.grantMatchingWaiters(entry);
    }
  }

  release(actorId: string, entry: TurnEntry): void {
    entry.activeCalls -= 1;
    if (entry.activeCalls === 0) {
      entry.reentrancyId = undefined;
      entry.reentrancyAllowed = false;
      this.grantNextTurn(entry);
    }
    this.releaseReference(actorId, entry);
  }

  private tryEnter(entry: TurnEntry, reentrancyId: string | undefined): boolean {
    if (!this.canEnter(entry, reentrancyId)) {
      return false;
    }
    this.enter(entry, reentrancyId);
    return true;
  }

  private canEnter(entry: TurnEntry, reentrancyId: string | undefined): boolean {
    return (
      entry.activeCalls === 0 ||
      (entry.reentrancyAllowed && reentrancyId !== undefined && entry.reentrancyId === reentrancyId)
    );
  }

  private enter(entry: TurnEntry, reentrancyId: string | undefined): void {
    if (entry.activeCalls === 0) {
      entry.reentrancyId = reentrancyId;
      entry.reentrancyAllowed = false;
    }
    entry.activeCalls += 1;
  }

  /**
   * Starts the next turn with the oldest waiter only. Reentrancy stays closed until
   * that turn calls `allowReentrancy`, so the waiter behind it cannot slip in first.
   */
  private grantNextTurn(entry: TurnEntry): void {
    const waiter = entry.waiters.shift();
    if (waiter === undefined) {
      return;
    }
    this.enter(entry, waiter.reentrancyId);
    // Resume after `release` returns so the next turn does not run inside it.
    queueMicrotask(waiter.grant);
  }

  /**
   * Lets every queued call from the active chain enter, and leaves other chains in order.
   */
  private grantMatchingWaiters(entry: TurnEntry): void {
    if (!entry.reentrancyAllowed || entry.reentrancyId === undefined) {
      return;
    }

    const remaining: TurnWaiter[] = [];
    const granted: TurnWaiter[] = [];
    for (const waiter of entry.waiters) {
      if (waiter.reentrancyId !== undefined && waiter.reentrancyId === entry.reentrancyId) {
        this.enter(entry, waiter.reentrancyId);
        granted.push(waiter);
      } else {
        remaining.push(waiter);
      }
    }
    entry.waiters = remaining;
    for (const waiter of granted) {
      queueMicrotask(waiter.grant);
    }
  }

  private releaseReference(actorId: string, entry: TurnEntry): void {
    entry.references -= 1;
    if (entry.references === 0) {
      this.entries.delete(actorId);
    }
  }
}
