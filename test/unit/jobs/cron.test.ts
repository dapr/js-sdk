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

import {
  CronExpression,
  CronExpressionBuilder,
  CronPeriod,
  DayOfWeek,
  Month,
} from "../../../src/types/jobs/CronExpression.type";

describe("CRON Expressions", () => {

  it("Seconds and minutes regexes are good", () => {
    expect(CronExpression.SecondsAndMinutesRegexText.test("*")).toBe(true);
    expect(CronExpression.SecondsAndMinutesRegexText.test("1")).toBe(true);
    expect(CronExpression.SecondsAndMinutesRegexText.test("0/5")).toBe(true);
    expect(CronExpression.SecondsAndMinutesRegexText.test("3-9")).toBe(true);
    expect(CronExpression.SecondsAndMinutesRegexText.test("2,6,10,14,18,22")).toBe(true);
  });

  it("Hours regex is good", () => {
    expect(CronExpression.HoursRegexText.test("*")).toBe(true);
    expect(CronExpression.HoursRegexText.test("1")).toBe(true);
    expect(CronExpression.HoursRegexText.test("0/5")).toBe(true);
    expect(CronExpression.HoursRegexText.test("3-9")).toBe(true);
    expect(CronExpression.HoursRegexText.test("2,6,10,14,18,22")).toBe(true);
  });

  it("Day of month regex is good", () => {
    expect(CronExpression.DayOfMonthRegexText.test("*")).toBe(true);
    expect(CronExpression.DayOfMonthRegexText.test("1")).toBe(true);
    expect(CronExpression.DayOfMonthRegexText.test("0/5")).toBe(true);
    expect(CronExpression.DayOfMonthRegexText.test("3-9")).toBe(true);
    expect(CronExpression.DayOfMonthRegexText.test("2,6,10,14,18,22")).toBe(true);
  });

  it("Month regex is good", () => {
    expect(CronExpression.MonthRegexText.test("*")).toBe(true);
    expect(CronExpression.MonthRegexText.test("1")).toBe(true);
    expect(CronExpression.MonthRegexText.test("0/5")).toBe(true);
    expect(CronExpression.MonthRegexText.test("3-9")).toBe(true);
    expect(CronExpression.MonthRegexText.test("3-9")).toBe(true);
    expect(CronExpression.MonthRegexText.test("2,6,10")).toBe(true);
  });

  it("Day of week regex is good", () => {
    expect(CronExpression.DayOfWeekRegexText.test("*")).toBe(true);
    expect(CronExpression.DayOfWeekRegexText.test("1")).toBe(true);
    expect(CronExpression.DayOfWeekRegexText.test("0/5")).toBe(true);
    expect(CronExpression.DayOfWeekRegexText.test("3-7")).toBe(true);
    expect(CronExpression.DayOfWeekRegexText.test("2,6,3")).toBe(true);
  });

  it("Every second string is valid", () => {
    expect(CronExpression.isCronExpression("* * * * * *")).toBe(true);
  });

  it("Every minute string is valid", () => {
    expect(CronExpression.isCronExpression("0 * * * * *")).toBe(true);
  });

  it("Every hour string is valid", () => {
    expect(CronExpression.isCronExpression("0 0 * * * *")).toBe(true);
  });

  it("Every third hour on Mondays string is valid", () => {
    expect(CronExpression.isCronExpression("0 0 */3 * * 1")).toBe(true);
  });

  it("A fairly complicated string is valid", () => {
    expect(CronExpression.isCronExpression("*/5 2,6,10 8-14 * 1 *")).toBe(true);
  });

  it("On second results in matching cron string", () => {
    const cronExpression = CronExpressionBuilder.on(CronPeriod.Second, 5);

    expect(cronExpression.toString()).toEqual("5 * * * * *");
  });

  it("On minute results in matching cron string", () => {
    const cronExpression = CronExpressionBuilder.on(CronPeriod.Minute, 5);

    expect(cronExpression.toString()).toEqual("* 5 * * * *");
  });

  it("On hour results in matching cron string", () => {
    const cronExpression = CronExpressionBuilder.on(CronPeriod.Hour, 5);

    expect(cronExpression.toString()).toEqual("* * 5 * * *");
  });

  it("On day of month results in matching cron string", () => {
    const cronExpression = CronExpressionBuilder.on(CronPeriod.DayOfMonth, 5);

    expect(cronExpression.toString()).toEqual("* * * 5 * *");
  });

  it("Combined on results in matching cron string", () => {
    const cronExpression = CronExpressionBuilder.on(CronPeriod.Second, 1)
      .on(CronPeriod.Minute, 2)
      .on(CronPeriod.Hour, 3)
      .on(CronPeriod.DayOfMonth, 4);

    expect(cronExpression.toString()).toEqual("1 2 3 4 * *");
  });

  it("Daily should create a daily cron string", () => {
    const cronExpression = CronExpressionBuilder.on(CronPeriod.DayOfWeek, [DayOfWeek.Thursday]).toString();

    expect(cronExpression).toEqual("* * * * * THU");
  });

  it("Monthly should create a monthly cron string", () => {
    const cronExpression = CronExpressionBuilder.on(CronPeriod.Month, [Month.January]).toString();

    expect(cronExpression).toEqual("* * * * JAN *");
  });

  it("Through seconds should create a valid cron string", () => {
    const cronExpression = CronExpressionBuilder.through(CronPeriod.Second, 13, 42).toString();

    expect(cronExpression).toEqual("13-42 * * * * *");
  });

  it("Through minutes should create a valid cron string", () => {
    const cronExpression = CronExpressionBuilder.through(CronPeriod.Minute, 13, 42).toString();

    expect(cronExpression).toEqual("* 13-42 * * * *");
  });

  it("Through hours should create a valid cron string", () => {
    const cronExpression = CronExpressionBuilder.through(CronPeriod.Hour, 13, 15).toString();

    expect(cronExpression).toEqual("* * 13-15 * * *");
  });

  it("Through days of the month should create a valid cron string", () => {
    const cronExpression = CronExpressionBuilder.through(CronPeriod.DayOfMonth, 19, 24).toString();

    expect(cronExpression).toEqual("* * * 19-24 * *");
  });

  it("Through days of the week should create a valid cron string", () => {
    const cronExpression = CronExpressionBuilder.through(
      CronPeriod.DayOfWeek,
      DayOfWeek.Sunday,
      DayOfWeek.Saturday,
    ).toString();

    expect(cronExpression).toEqual("* * * * * SUN-SAT");
  });

  it("Through days of the month should create a valid cron string", () => {
    const cronExpression = CronExpressionBuilder.through(
      CronPeriod.Month,
      Month.June,
      Month.September,
    ).toString();

    expect(cronExpression).toEqual("* * * * JUN-SEP *");
  });

  it("Bad through seconds order should fail", () => {
    const cronExpressionThrow = () => CronExpressionBuilder.through(CronPeriod.Second, 59, 14).toString();

    expect(cronExpressionThrow).toThrow();
  });

  it("Bad through minutes order should fail", () => {
    const cronExpressionThrow = () => CronExpressionBuilder.through(CronPeriod.Minute, 59, 14).toString();

    expect(cronExpressionThrow).toThrow();
  });

  it("Bad through hours order should fail", () => {
    const cronExpressionThrow = () => CronExpressionBuilder.through(CronPeriod.Hour, 23, 14).toString();

    expect(cronExpressionThrow).toThrow();
  });

  it("Bad through hours order should fail", () => {
    const cronExpressionThrow = () => CronExpressionBuilder.through(CronPeriod.DayOfMonth, 24, 19).toString();

    expect(cronExpressionThrow).toThrow();
  });

  it("Bad through weekday order should fail", () => {
    const cronExpressionThrow = () =>
      CronExpressionBuilder.through(CronPeriod.DayOfWeek, DayOfWeek.Friday, DayOfWeek.Sunday).toString();

    expect(cronExpressionThrow).toThrow();
  });

  it("Bad through month order should fail", () => {
    const cronExpressionThrow = () =>
      CronExpressionBuilder.through(CronPeriod.Month, Month.May, Month.March).toString();

    expect(cronExpressionThrow).toThrow();
  });

  it("Multiple months should create a sorted multi-month cron string", () => {
    const cronExpression = CronExpressionBuilder.on(CronPeriod.Month, [Month.December, Month.January]).toString();

    expect(cronExpression).toEqual("* * * * JAN,DEC *");
  });

  it("Every should overwrite", () => {
    const cronExpression = CronExpressionBuilder
        .on(CronPeriod.Month, [Month.December, Month.January])
        .on(CronPeriod.DayOfWeek, DayOfWeek.Wednesday)
        .every(CronPeriod.DayOfWeek)
        .toString();

    expect(cronExpression).toEqual("* * * * JAN,DEC *");
  });
});
