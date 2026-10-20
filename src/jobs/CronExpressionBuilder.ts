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

export type CronPeriod = "second" | "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";

const bounds: Record<CronPeriod, readonly [number, number]> = {
  second: [0, 59],
  minute: [0, 59],
  hour: [0, 23],
  dayOfMonth: [1, 31],
  month: [1, 12],
  dayOfWeek: [0, 6],
};

/** Fluent six-field cron builder, following the .NET Jobs SDK's on/through/each/every model. */
export class CronExpressionBuilder {
  private readonly fields: Record<CronPeriod, string> = {
    second: "*",
    minute: "*",
    hour: "*",
    dayOfMonth: "*",
    month: "*",
    dayOfWeek: "*",
  };
  private timeZone?: string;

  on(period: CronPeriod, ...values: number[]): this {
    if (values.length === 0) {
      throw new RangeError("At least one cron value is required");
    }
    values.forEach((value) => this.validate(period, value));
    this.fields[period] = [...new Set(values)].sort((a, b) => a - b).join(",");
    return this;
  }

  through(period: CronPeriod, from: number, to: number): this {
    this.validate(period, from);
    this.validate(period, to);
    if (from >= to) {
      throw new RangeError("Cron range start must precede its end");
    }
    this.fields[period] = `${from}-${to}`;
    return this;
  }

  each(period: CronPeriod): this {
    this.getBounds(period);
    this.fields[period] = "*";
    return this;
  }

  every(period: CronPeriod, interval: number): this {
    const [min, max] = this.getBounds(period);
    if (!Number.isInteger(interval) || interval < 1 || interval > max - min + 1) {
      throw new RangeError(`Invalid cron interval for ${period}: ${interval}`);
    }
    this.fields[period] = `*/${interval}`;
    return this;
  }

  withTimeZone(timeZone: string): this {
    if (typeof timeZone !== "string" || !timeZone || /\s/.test(timeZone)) {
      throw new RangeError("A valid IANA time zone is required");
    }
    new Intl.DateTimeFormat("en", { timeZone });
    this.timeZone = timeZone;
    return this;
  }

  toString(): string {
    const expression = Object.values(this.fields).join(" ");
    return this.timeZone ? `CRON_TZ=${this.timeZone} ${expression}` : expression;
  }

  private getBounds(period: CronPeriod): readonly [number, number] {
    if (!Object.prototype.hasOwnProperty.call(bounds, period)) {
      throw new RangeError(`Unknown cron period: ${period}`);
    }
    return bounds[period];
  }

  private validate(period: CronPeriod, value: number): void {
    const [min, max] = this.getBounds(period);
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new RangeError(`Cron ${period} must be an integer between ${min} and ${max}`);
    }
  }
}
