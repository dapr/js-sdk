import { ActorCallType } from "./ActorCallType";

export default class ActorMethodContext {
    private readonly methodName: string;
    private readonly callType: ActorCallType;

    private constructor(methodName: string, callType: ActorCallType) {
        this.methodName = methodName;
        this.callType = callType;
    }

    public getMethodName(): string {
        return this.methodName;
    }

    public getCallType(): ActorCallType {
        return this.callType;
    }

    static createForActor(methodName: string): ActorMethodContext {
        return new ActorMethodContext(methodName, ActorCallType.ACTOR_INTERFACE_METHOD);
    }

    static createForTimer(methodName: string): ActorMethodContext {
        return new ActorMethodContext(methodName, ActorCallType.TIMER_METHOD);
    }

    static createForReminder(methodName: string): ActorMethodContext {
        return new ActorMethodContext(methodName, ActorCallType.REMINDER_METHOD);
    }
}