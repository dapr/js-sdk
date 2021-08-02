import StateChangeKind from "./StateChangeKind";

export default class ActorStateChange<T> {
    private readonly stateName: string;
    private readonly value: T;
    private readonly changeKind: StateChangeKind;

    constructor(stateName: string, value: T, changeKind: StateChangeKind) {
        this.stateName = stateName;
        this.value = value;
        this.changeKind = changeKind;
    }

    getStateName(): string {
        return this.stateName;
    }

    getValue(): T {
        return this.value;
    }

    getChangeKind(): StateChangeKind {
        return this.changeKind;
    }
}