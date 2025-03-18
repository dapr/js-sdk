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
export type CronExpressionString = `${string} ${string} ${string} ${string} ${string} ${string}`;

export enum CronPeriod {
  Second,
  Minute,
  Hour,
  DayOfWeek,
  DayOfMonth,
  Month,
}

export type TimeValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59;

export type DayOfMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31;

export enum DayOfWeek {
  Sunday = "SUN",
  Monday = "MON",
  Tuesday = "TUE",
  Wednesday = "WED",
  Thursday = "THU",
  Friday = "FRI",
  Saturday = "SAT",
}

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

export class CronExpressionBuilder {

  public static on(period: CronPeriod.Second, ...values: (TimeValue[] | TimeValue)[]): CronExpression;
  public static on(period: CronPeriod.Minute, ...values: (TimeValue[] | TimeValue)[]): CronExpression;
  public static on(period: CronPeriod.Hour, ...values: (TimeValue[] | TimeValue)[]): CronExpression;
  public static on(period: CronPeriod.DayOfWeek, ...values: (DayOfWeek[] | DayOfWeek)[]): CronExpression;
  public static on(period: CronPeriod.DayOfMonth, ...values: (DayOfMonth[] | DayOfMonth)[]): CronExpression;
  public static on(period: CronPeriod.Month, ...values: (Month[] | Month)[]): CronExpression;
  public static on(period: any, ...values: (any[] | any)[]) {
    return new CronExpression().on(period, values.flat());
  }

  public static through(period: CronPeriod.Second, from: TimeValue, to: TimeValue): CronExpression;
  public static through(period: CronPeriod.Minute, from: TimeValue, to: TimeValue): CronExpression;
  public static through(period: CronPeriod.Hour, from: TimeValue, to: TimeValue): CronExpression;
  public static through(period: CronPeriod.DayOfWeek, from: DayOfWeek, to: DayOfWeek): CronExpression;
  public static through(period: CronPeriod.DayOfMonth, from: DayOfMonth, to: DayOfMonth): CronExpression;
  public static through(period: CronPeriod.Month, from: Month, to: Month): CronExpression;
  public static through(period: any, from: any, to: any) {
    return new CronExpression().through(period, from, to);
  }

  public static every(period: CronPeriod) {
    return new CronExpression().every(period);
  }
}

export class CronExpression {
  private static readonly SecondsAndMinutesRegexText = /([0-5]?\d-[0-5]?\d)|([0-5]?\d,?)|(\*(\/[0-5]?\d)?)/;
  private static readonly HoursRegexText =
    /(([0-1]?\d)|(2[0-3])-([0-1]?\d)|(2[0-3]))|(([0-1]?\d)|(2[0-3]),?)|(\*(\/([0-1]?\d)|(2[0-3]))?)/;
  private static readonly DayOfMonthRegexText =
    /\*|(\*\/(([0-2]?\d)|(3[0-1])))|(((([0-2]?\d)|(3[0-1]))(-(([0-2]?\d)|(3[0-1])))?))/;
  private static readonly MonthRegexText =
    /(^(\*\/)?((0?\d)|(1[0-2]))$)|(^\*$)|(^((0?\d)|(1[0-2]))(-((0?\d)|(1[0-2]))?)$)|(^(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:-(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?(?:,(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:-(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?)*$)/;
  private static readonly DayOfWeekRegexText =
    /\*|(\*\/(0?[0-6])|(0?[0-6](-0?[0-6])?)|((,?(SUN|MON|TUE|WED|THU|FRI|SAT))+)|((SUN|MON|TUE|WED|THU|FRI|SAT)(-(SUN|MON|TUE|WED|THU|FRI|SAT))?))/;

  private static readonly cronExpressionRegex = new RegExp(
    `${CronExpression.SecondsAndMinutesRegexText.source} ${CronExpression.SecondsAndMinutesRegexText.source} ${CronExpression.HoursRegexText.source} ${CronExpression.DayOfMonthRegexText.source} ${CronExpression.MonthRegexText.source} ${CronExpression.DayOfWeekRegexText.source}`,
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

  public on(period: CronPeriod.Second, ...values: (TimeValue[] | TimeValue)[]): this;
  public on(period: CronPeriod.Minute, ...values: (TimeValue[] | TimeValue)[]): this;
  public on(period: CronPeriod.Hour, ...values: (TimeValue[] | TimeValue)[]): this;
  public on(period: CronPeriod.DayOfWeek, ...values: (DayOfWeek[] | DayOfWeek)[]): this;
  public on(period: CronPeriod.DayOfMonth, ...values: (DayOfMonth[] | DayOfMonth)[]): this;
  public on(period: CronPeriod.Month, ...values: (Month[] | Month)[]): this;
  public on(period: any, ...values: (any[] | any)[]): this {
    const fixedValues = values.flat();

    switch (period) {
      case CronPeriod.Second:
        this.seconds = this.prepareTimeValueList(fixedValues);
        break;
      case CronPeriod.Minute:
        this.minutes = this.prepareTimeValueList(fixedValues);
        break;
      case CronPeriod.Hour:
        this.hours = this.prepareTimeValueList(fixedValues);
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

  public through(period: CronPeriod.Second, from: TimeValue, to: TimeValue): CronExpression;
  public through(period: CronPeriod.Minute, from: TimeValue, to: TimeValue): CronExpression;
  public through(period: CronPeriod.Hour, from: TimeValue, to: TimeValue): CronExpression;
  public through(period: CronPeriod.DayOfWeek, from: DayOfWeek, to: DayOfWeek): CronExpression;
  public through(period: CronPeriod.DayOfMonth, from: DayOfMonth, to: DayOfMonth): CronExpression;
  public through(period: CronPeriod.Month, from: Month, to: Month): CronExpression;
  public through(period: any, from: any, to: any) {

    switch (period) {
      case CronPeriod.Second:
        this.seconds = this.prepareTimeValueRange(from, to);
        break;
      case CronPeriod.Minute:
        this.minutes = this.prepareTimeValueRange(from, to);
        break;
      case CronPeriod.Hour:
        this.hours = this.prepareTimeValueRange(from, to);
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

  public every(period: CronPeriod): this {
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

  public toString(): CronExpressionString {
    return `${this.seconds} ${this.minutes} ${this.hours} ${this.dayOfMonth} ${this.month} ${this.dayOfWeek}`;
  }

  private prepareTimeValueRange(from: TimeValue, to: TimeValue) {
    if (from >= to)
      throw new Error("Invalid range: 'from' must be less than 'to'");

    if ([from, to].some((v) => v < 0 || v > 59))
      throw new RangeError("Time values must be within 0 and 59, inclusively.");

    return `${from}-${to}`;
  }

  private prepareDayOfMonthValueRange(from: DayOfMonth, to: DayOfMonth) {
    if (from >= to)
      throw new Error("Invalid range: 'from' must be less than 'to'");

    if ([from, to].some((v) => v < 1 || v > 31))
      throw new RangeError("Day of month values must be within 1 and 31, inclusively.");

    return `${from}-${to}`;
  }

  private prepareMonthValueRange(from: Month, to: Month) {
    if (Object.values(Month).indexOf(from) >= Object.values(Month).indexOf(to))
      throw new Error("Invalid range: 'from' must be less than 'to'");

    return `${from}-${to}`;
  }

  private prepareDayOfWeekValueRange(from: DayOfWeek, to: DayOfWeek) {
    if (Object.values(DayOfWeek).indexOf(from) >= Object.values(DayOfWeek).indexOf(to))
      throw new Error("Invalid range: 'from' must be less than 'to'");

    return `${from}-${to}`;
  }

  private prepareTimeValueList(timeValues: TimeValue[]) {
    if (timeValues.some((v) => v < 0 || v > 59))
      throw new RangeError("Time values must be within 0 and 59, inclusively.");

    return [...timeValues].sort((a, b) => a - b).join(",");
  }

  private prepareDayOfMonthValueList(dayOfMonthValues: DayOfMonth[]) {
    if (dayOfMonthValues.some((v) => v < 1 || v > 31))
      throw new RangeError("Day of month values must be within 1 and 31, inclusively.");

    return [...dayOfMonthValues].sort((a, b) => a - b).join(",");
  }

  private prepareMonthValueList(monthValues: Month[]) {
    return [...monthValues]
        .sort((left, right) => Object.values(Month).indexOf(left) - Object.values(Month).indexOf(right))
        .join(",");
  }

  private prepareDayOfWeekValueList(dayValues: DayOfWeek[]) {
    return [...dayValues]
        .sort((left, right) => Object.values(DayOfWeek).indexOf(left) - Object.values(DayOfWeek).indexOf(right))
        .join(",");
  }
}
