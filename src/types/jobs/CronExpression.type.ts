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

// note: This can get crazy, more than TS can really handle.
import { BuildNumberRange } from "../BuildNumberRange";

export type CronExpressionString = `${string} ${string} ${string} ${string} ${string} ${string}`;

export enum CronPeriod {
  Second,
  Minute,
  Hour,
  DayOfWeek,
  DayOfMonth,
  Month,
}

export type SecondOrMinute = BuildNumberRange<0, 59>;
export type Hour = BuildNumberRange<0, 23>;
export type DayOfMonth = BuildNumberRange<1, 31>;
export type DayOfWeekNumber = BuildNumberRange<0, 6>;
export type MonthNumber = BuildNumberRange<1, 12>;

export enum DayOfWeek {
  Sunday = "SUN",
  Monday = "MON",
  Tuesday = "TUE",
  Wednesday = "WED",
  Thursday = "THU",
  Friday = "FRI",
  Saturday = "SAT",
}

export type DayOfWeekValue = DayOfWeek | DayOfWeekNumber;

export enum Month {
  January = "JAN",
  February = "FEB",
  March = "MAR",
  April = "APR",
  May = "MAY",
  June = "JUN",
  July = "JUL",
  August = "AUG",
  September = "SEP",
  October = "OCT",
  November = "NOV",
  December = "DEC",
}

export type MonthValue = Month | MonthNumber;

export class CronExpressionBuilder {
  public static on(
    period: CronPeriod.Second,
    ...values: (SecondOrMinute[] | SecondOrMinute)[]
  ): CronExpression;
  public static on(
    period: CronPeriod.Minute,
    ...values: (SecondOrMinute[] | SecondOrMinute)[]
  ): CronExpression;
  public static on(period: CronPeriod.Hour, ...values: (Hour[] | Hour)[]): CronExpression;
  public static on(period: CronPeriod.DayOfWeek, ...values: (DayOfWeekValue[] | DayOfWeekValue)[]): CronExpression;
  public static on(period: CronPeriod.DayOfMonth, ...values: (DayOfMonth[] | DayOfMonth)[]): CronExpression;
  public static on(period: CronPeriod.Month, ...values: (MonthValue[] | MonthValue)[]): CronExpression;
  public static on(period: any, ...values: (any[] | any)[]) {
    return new CronExpression().on(period, values.flat());
  }

  public static through(period: CronPeriod.Second, from: SecondOrMinute, to: SecondOrMinute): CronExpression;
  public static through(period: CronPeriod.Minute, from: SecondOrMinute, to: SecondOrMinute): CronExpression;
  public static through(period: CronPeriod.Hour, from: Hour, to: Hour): CronExpression;
  public static through(period: CronPeriod.DayOfWeek, from: DayOfWeekValue, to: DayOfWeekValue): CronExpression;
  public static through(period: CronPeriod.DayOfMonth, from: DayOfMonth, to: DayOfMonth): CronExpression;
  public static through(period: CronPeriod.Month, from: MonthValue, to: MonthValue): CronExpression;
  public static through(period: any, from: any, to: any): CronExpression {
    return new CronExpression().through(period, from, to);
  }

  public static each(period: CronPeriod.Second): CronExpression;
  public static each(period: CronPeriod.Minute): CronExpression;
  public static each(period: CronPeriod.Hour): CronExpression;
  public static each(period: CronPeriod.DayOfWeek): CronExpression;
  public static each(period: CronPeriod.DayOfMonth): CronExpression;
  public static each(period: CronPeriod.Month): CronExpression;
  public static each(period: any) {
    return new CronExpression().each(period);
  }

  public static every(period: CronPeriod.Second, interval: SecondOrMinute): CronExpression;
  public static every(period: CronPeriod.Minute, interval: SecondOrMinute): CronExpression;
  public static every(period: CronPeriod.Hour, interval: Hour): CronExpression;
  public static every(period: CronPeriod.DayOfWeek, interval: DayOfWeekValue): CronExpression;
  public static every(period: CronPeriod.DayOfMonth, interval: DayOfMonth): CronExpression;
  public static every(period: CronPeriod.Month, interval: MonthValue): CronExpression;
  public static every(period: any, interval: any) {
    return new CronExpression().every(period, interval);
  }
}

export class CronExpression {
  public static readonly SecondsAndMinutesRegexText = /(?:\*(?:\/[0-5]?\d)?|(?:[0-5]?\d)(?:-(?:[0-5]?\d))?(?:,(?:[0-5]?\d)(?:-(?:[0-5]?\d))?)*)/;
  public static readonly HoursRegexText = /(?:\*(?:\/(?:[0-1]?\d|2[0-3]))?|(?:[0-1]?\d|2[0-3])(?:-(?:[0-1]?\d|2[0-3]))?(?:,(?:[0-1]?\d|2[0-3])(?:-(?:[0-1]?\d|2[0-3]))?)*)/;
  public static readonly DayOfMonthRegexText = /(?:\*(?:\/(?:[1-9]|[12]\d|3[01]))?|(?:[1-9]|[12]\d|3[01])(?:-(?:[1-9]|[12]\d|3[01]))?(?:,(?:[1-9]|[12]\d|3[01])(?:-(?:[1-9]|[12]\d|3[01]))?)*)/;
  public static readonly MonthRegexText = /(?:\*(?:\/(?:0?[1-9]|1[0-2]))?|(?:0?[1-9]|1[0-2])(?:-(?:0?[1-9]|1[0-2]))?(?:,(?:0?[1-9]|1[0-2])(?:-(?:0?[1-9]|1[0-2]))?)*)|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:-(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?(?:,(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:-(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?)*/;
  public static readonly DayOfWeekRegexText = /(?:\*(?:\/[0-6])?|[0-6](?:-[0-6])?(?:,[0-6](?:-[0-6])?)*)|(?:SUN|MON|TUE|WED|THU|FRI|SAT)(?:-(?:SUN|MON|TUE|WED|THU|FRI|SAT))?(?:,(?:SUN|MON|TUE|WED|THU|FRI|SAT)(?:-(?:SUN|MON|TUE|WED|THU|FRI|SAT))?)*/;

  public static readonly cronExpressionRegex = new RegExp(
    `^(${CronExpression.SecondsAndMinutesRegexText.source})\\s(${CronExpression.SecondsAndMinutesRegexText.source})\\s(${CronExpression.HoursRegexText.source})\\s(${CronExpression.DayOfMonthRegexText.source})\\s(${CronExpression.MonthRegexText.source})\\s(${CronExpression.DayOfWeekRegexText.source})$`,
  );

  public static isCronExpression(value: string) {
    return CronExpression.cronExpressionRegex.test(value);
  }

  private seconds = "*";
  private minutes = "*";
  private hours = "*";
  private dayOfMonth = "*";
  private month = "*";
  private dayOfWeek = "*";

  public on(period: CronPeriod.Second, ...values: (SecondOrMinute[] | SecondOrMinute)[]): this;
  public on(period: CronPeriod.Minute, ...values: (SecondOrMinute[] | SecondOrMinute)[]): this;
  public on(period: CronPeriod.Hour, ...values: (Hour[] | Hour)[]): this;
  public on(period: CronPeriod.DayOfWeek, ...values: (DayOfWeekValue[] | DayOfWeekValue)[]): this;
  public on(period: CronPeriod.DayOfMonth, ...values: (DayOfMonth[] | DayOfMonth)[]): this;
  public on(period: CronPeriod.Month, ...values: (MonthValue[] | MonthValue)[]): this;
  public on(period: any, ...values: (any[] | any)[]): this {
    const fixedValues = values.flat();

    switch (period) {
      case CronPeriod.Second:
        this.seconds = this.prepareSecondOrMinuteValueList(fixedValues);
        break;
      case CronPeriod.Minute:
        this.minutes = this.prepareSecondOrMinuteValueList(fixedValues);
        break;
      case CronPeriod.Hour:
        this.hours = this.prepareHourValueList(fixedValues);
        break;
      case CronPeriod.DayOfWeek:
        this.dayOfWeek = this.prepareDayOfWeekValueList(fixedValues);
        break;
      case CronPeriod.DayOfMonth:
        this.dayOfMonth = this.prepareDayOfMonthValueList(fixedValues);
        break;
      case CronPeriod.Month:
        this.month = this.prepareMonthValueList(fixedValues);
        break;
    }

    return this;
  }

  public through(period: CronPeriod.Second, from: SecondOrMinute, to: SecondOrMinute): CronExpression;
  public through(period: CronPeriod.Minute, from: SecondOrMinute, to: SecondOrMinute): CronExpression;
  public through(period: CronPeriod.Hour, from: SecondOrMinute, to: SecondOrMinute): CronExpression;
  public through(period: CronPeriod.DayOfWeek, from: DayOfWeekValue, to: DayOfWeekValue): CronExpression;
  public through(period: CronPeriod.DayOfMonth, from: DayOfMonth, to: DayOfMonth): CronExpression;
  public through(period: CronPeriod.Month, from: MonthValue, to: MonthValue): CronExpression;
  public through(period: any, from: any, to: any): this {
    switch (period) {
      case CronPeriod.Second:
        this.seconds = this.prepareSecondOrMinuteValueRange(from, to);
        break;
      case CronPeriod.Minute:
        this.minutes = this.prepareSecondOrMinuteValueRange(from, to);
        break;
      case CronPeriod.Hour:
        this.hours = this.prepareHourValueRange(from, to);
        break;
      case CronPeriod.DayOfWeek:
        this.dayOfWeek = this.prepareDayOfWeekValueRange(from, to);
        break;
      case CronPeriod.DayOfMonth:
        this.dayOfMonth = this.prepareDayOfMonthValueRange(from, to);
        break;
      case CronPeriod.Month:
        this.month = this.prepareMonthValueRange(from, to);
        break;
    }

    return this;
  }

  public each(period: CronPeriod.Second): this;
  public each(period: CronPeriod.Minute): this;
  public each(period: CronPeriod.Hour): this;
  public each(period: CronPeriod.DayOfWeek): this;
  public each(period: CronPeriod.DayOfMonth): this;
  public each(period: CronPeriod.Month): this;
  public each(period: any): this {
    switch (period) {
      case CronPeriod.Second:
        this.seconds = "*";
        break;
      case CronPeriod.Minute:
        this.minutes = "*";
        break;
      case CronPeriod.Hour:
        this.hours = "*";
        break;
      case CronPeriod.DayOfWeek:
        this.dayOfWeek = "*";
        break;
      case CronPeriod.DayOfMonth:
        this.dayOfMonth = "*";
        break;
      case CronPeriod.Month:
        this.month = "*";
        break;
    }
    return this;
  }

  public every(period: CronPeriod.Second, interval: SecondOrMinute): this;
  public every(period: CronPeriod.Minute, interval: SecondOrMinute): this;
  public every(period: CronPeriod.Hour, interval: Hour): this;
  public every(period: CronPeriod.DayOfWeek, interval: DayOfWeekValue): this;
  public every(period: CronPeriod.DayOfMonth, interval: DayOfMonth): this;
  public every(period: CronPeriod.Month, interval: MonthValue): this;
  public every(period: any, interval: any): this {

    const intervalValue = `*/${interval}`;

    switch (period) {
      case CronPeriod.Second:
        this.seconds = intervalValue;
        break;
      case CronPeriod.Minute:
        this.minutes = intervalValue;
        break;
      case CronPeriod.Hour:
        this.hours = intervalValue;
        break;
      case CronPeriod.DayOfWeek:
        this.dayOfWeek = intervalValue;
        break;
      case CronPeriod.DayOfMonth:
        this.dayOfMonth = intervalValue;
        break;
      case CronPeriod.Month:
        this.month = intervalValue;
        break;
    }
    return this;
  }

  public toString(): CronExpressionString {
    return `${this.seconds} ${this.minutes} ${this.hours} ${this.dayOfMonth} ${this.month} ${this.dayOfWeek}`;
  }

  private prepareSecondOrMinuteValueRange(from: SecondOrMinute, to: SecondOrMinute) {
    if (from >= to) throw new Error("Invalid range: 'from' must be less than 'to'");

    if ([from, to].some((v) => v < 0 || v > 59))
      throw new RangeError("Time values must be within 0 and 59, inclusive.");

    return `${from}-${to}`;
  }

  private prepareHourValueRange(from: Hour, to: Hour) {
    if (from >= to) throw new Error("Invalid range: 'from' must be less than 'to'");

    if ([from, to].some((v) => v < 0 || v > 23))
      throw new RangeError("Hour values must be within 0 and 23, inclusive.");

    return `${from}-${to}`;
  }

  private prepareDayOfMonthValueRange(from: DayOfMonth, to: DayOfMonth) {
    if (from >= to) throw new Error("Invalid range: 'from' must be less than 'to'");

    if ([from, to].some((v) => v < 1 || v > 31))
      throw new RangeError("Day of month values must be within 1 and 31, inclusive.");

    return `${from}-${to}`;
  }

  private prepareMonthValueRange(from: MonthValue, to: MonthValue) {
    if (typeof(from) !== "number" && typeof(to) !== "number" && Object.values(Month).indexOf(from) >= Object.values(Month).indexOf(to))
      throw new Error("Invalid range: 'from' must be less than 'to'");

    return `${from}-${to}`;
  }

  private prepareDayOfWeekValueRange(from: DayOfWeekValue, to: DayOfWeekValue) {
    if (typeof(from) !== "number" && typeof(to) !== "number" && Object.values(DayOfWeek).indexOf(from) >= Object.values(DayOfWeek).indexOf(to))
      throw new Error("Invalid range: 'from' must be less than 'to'");

    return `${from}-${to}`;
  }

  private prepareSecondOrMinuteValueList(timeValues: SecondOrMinute[]) {

    if (! timeValues.length)
      throw new Error("Empty time value provided.");

    if (timeValues.some((v) => v < 0 || v > 59))
      throw new RangeError("Time values must be within 0 and 59, inclusive.");

    return [...timeValues].sort((a, b) => a - b).join(",");
  }

  private prepareHourValueList(timeValues: Hour[]) {

    if (! timeValues.length)
      throw new Error("Empty hour value provided.");

    if (timeValues.some((v) => v < 0 || v > 23))
      throw new RangeError("Hour values must be within 0 and 23, inclusive.");

    return [...timeValues].sort((a, b) => a - b).join(",");
  }

  private prepareDayOfMonthValueList(dayOfMonthValues: DayOfMonth[]) {

    if (! dayOfMonthValues.length || dayOfMonthValues.some((v) => ! v))
      throw new Error("Empty day of month value provided.");

    if (dayOfMonthValues.some((v) => v < 1 || v > 31))
      throw new RangeError("Day of month values must be within 1 and 31, inclusive.");

    return [...dayOfMonthValues].sort((a, b) => a - b).join(",");
  }

  private prepareMonthValueList(monthValues: Month[]) {

    if (! monthValues.length || monthValues.some((v) => ! v))
      throw new Error("Empty month value provided.");

    return [...monthValues]
      .sort((left, right) => Object.values(Month).indexOf(left) - Object.values(Month).indexOf(right))
      .join(",");
  }

  private prepareDayOfWeekValueList(dayOfWeekValues: DayOfWeek[]) {

    if (! dayOfWeekValues.length || dayOfWeekValues.some((v) => ! v))
      throw new Error("Empty month value provided.");

    return [...dayOfWeekValues]
      .sort((left, right) => Object.values(DayOfWeek).indexOf(left) - Object.values(DayOfWeek).indexOf(right))
      .join(",");
  }
}
