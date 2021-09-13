/**
 * A enumeration that represents the kind of state change for an actor state
 * when saves change is called to a set of actor states.
 */
enum StateChangeKind {
    // No change in state
    NONE = 0,
    // The state needs to be added
    ADD = 1,
    // The state needs to be updated
    UPDATE = 2,
    // The state needs to be removed
    REMOVE = 3
}

export default StateChangeKind;