/*
Copyright 2025 The Dapr Authors
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

import { CronExpression, CronExpressionString } from "./CronExpression.type";

export enum PeriodConstant {
    Yearly = "@yearly",
    Monthly = "@monthly",
    Weekly = "@weekly",
    Daily = "@daily",
    Hourly = "@hourly",
}

type EveryExpressionString = `@every ${string}`;

class EveryExpression {

    private static readonly EveryExpressionValue = /^(d+(m?s|m|h))+$/;

    private readonly value: string;

    public static isEveryExpression(value: string) {
        return EveryExpression.EveryExpressionValue.test(`@every ${value}`);
    }

    constructor(value: string) {

        if (! EveryExpression.isEveryExpression(value))
            throw new Error(`${value} is not a valid every expression value.`);

        this.value = value;
    }

    public toString(): EveryExpressionString {
        return `@every ${this.value}`;
    }
}

export type Schedule = PeriodConstant | EveryExpression | EveryExpressionString | CronExpression | CronExpressionString;

export class ScheduleUnboxer {

    private readonly value: Schedule | null;

    constructor(value: Schedule | null) {
        this.value = value;
    }

    public unbox(): string | null {
        if(this.value instanceof EveryExpression)
            return this.value.toString();
        if(this.value instanceof CronExpression)
            return this.value.toString();

        return this.value;
    }
}
