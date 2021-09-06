import BufferSerializer from "./BufferSerializer";

/**
 * Contains the actor reminder data
 */
export default class ActorTimerData {
  readonly timerName: string;
  readonly state: string | object | undefined;
  readonly callback: string;

  /**
   * @param reminderName the name of the actor reminder
   * @param state the state data passed to receiveReminder callback
   * @param callback the callback method to call
   */
  constructor(timerName: string, callback: string, state?: string | object | undefined) {
    this.timerName = timerName;
    this.callback = callback;
    this.state = state;
  }

  getTimerName(): string {
    return this.timerName;
  }

  getState(): string | object | undefined {
    return this.state;
  }

  getCallback(): string {
    return this.callback;
  }

  /**
   * Return this class as an object
   */
  toObject(): object {
    return {
      callback: this.callback,
      data: this.state
    }
  }

  static fromObject(reminderName: string, obj: any): ActorTimerData {
    const serializer = new BufferSerializer();

    const callback = obj?.callback;
    const data = obj?.data;

    const deserializedData = serializer.deserialize(data);

    return new ActorTimerData(reminderName, callback, deserializedData);
  }
}