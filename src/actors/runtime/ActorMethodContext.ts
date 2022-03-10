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