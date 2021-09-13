import BufferSerializer from "./BufferSerializer";

/**
 * Contains the actor reminder data
 */
export default class ActorReminderData {
  readonly reminderName: string;
  readonly state: string | object | undefined;
  readonly dueTime: number;
  readonly period: number;

  /**
   * @param reminderName the name of the actor reminder
   * @param state the state data passed to receiveReminder callback
   * @param dueTime the amount of time to delay before invoking the reminder for the first time
   * @param period the time interval between reminder invocations after the first invocation
   */
  constructor(reminderName: string, dueTime: number, period: number, state?: string | object) {
    this.reminderName = reminderName;
    this.dueTime = dueTime;
    this.period = period;
    this.state = state;
  }

  getReminderName(): string {
    return this.reminderName;
  }

  getState(): string | object | undefined {
    return this.state;
  }

  getDueTime(): number {
    return this.dueTime;
  }

  getPeriod(): number {
    return this.period;
  }

  /**
   * Return this class as an object
   */
  toObject(): object {
    return {
      reminderName: this.reminderName,
      dueTime: this.dueTime,
      period: this.period,
      data: this.state
    }
  }

  static fromObject(reminderName: string, obj: any): ActorReminderData {
    const serializer = new BufferSerializer();

    const data = obj?.data;
    const dueTime = obj?.dueTime;
    const period = obj?.period;

    const deserializedData = serializer.deserialize(data);

    return new ActorReminderData(reminderName, dueTime, period, deserializedData);
  }
}