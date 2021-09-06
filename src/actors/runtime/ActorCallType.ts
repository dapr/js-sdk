/**
 * Represents the call-type associated with the method invoked by the actor runtime
 */
export enum ActorCallType {
    /**
     * Specifies that the method invoked is an actor interface method for a given
     * client request.
     */
    ACTOR_INTERFACE_METHOD,
    /**
     * Specifies that the method invoked is a timer callback method.
     */
    TIMER_METHOD,
    /**
     * Specifies that the method is when a reminder fires.
     */
    REMINDER_METHOD
}