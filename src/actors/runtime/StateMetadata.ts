import StateChangeKind from "./StateChangeKind";

export default class StateMetadata<T> {
    private value: T;
    private changeKind: StateChangeKind;

    constructor(value: T, changeKind: StateChangeKind) {
        this.value = value;
        this.changeKind = changeKind;
    }

    getValue(): T {
        return this.value;
    }

    getChangeKind(): StateChangeKind {
        return this.changeKind;
    }

    setValue(value: T): void {
        this.value = value;
    }

    setChangeKind(changeKind: StateChangeKind): void {
        this.changeKind = changeKind;
    }
}