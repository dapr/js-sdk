/**
 * Actor runtime configuration that configures the Actor behavior in the Dapr Runtime
 */
export default class ActorRuntimeConfig {
    private actorIdleTimeout: number;
    private actorScanInterval: number;
    private drainOngoingCallTimeout: number;
    private drainRebalancedActors: boolean;

    /**
     * 
     * @param actorIdleTimeout The timeout before deactivating an idle actor
     * @param actorScanInterval The duration which specifies how often to scan for actors
     * to deactivate idle actors. Actors that have been idle longer than actorIdleTimeout will be deactivated
     * @param drainOngoingCallTimeout The duration when in the process of draining rebalanced actors.
     * This specifies the timeout for the current active actor method to finish. 
     * If there is no current actor method call, this is ignored.
     * @param drainRebalancedActors If true, Dapr will wait for drainOngoingCallTimeout
     * to allow a current actor call to complete before trying to deactivate an actor
     */
    constructor(actorIdleTimeout = 1 * 60 * 60, actorScanInterval = 30, drainOngoingCallTimeout = 1 * 60, drainRebalancedActors = true) {
        this.actorIdleTimeout = actorIdleTimeout;
        this.actorScanInterval = actorScanInterval;
        this.drainOngoingCallTimeout = drainOngoingCallTimeout;
        this.drainRebalancedActors = drainRebalancedActors;
    }

    getActorIdleTimeout(): number { 
        return this.actorIdleTimeout;
    }

    getActorScanInterval(): number { 
        return this.actorScanInterval;
    }

    getDrainOngoingCallTimeout(): number { 
        return this.drainOngoingCallTimeout;
    }

    getDrainRebalancedActors(): boolean { 
        return this.drainRebalancedActors;
    }
}