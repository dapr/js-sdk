/**
 * Contains the actor reminder data
 */
export default class ActorReminderData {
    readonly reminderName: string;
    readonly state: Buffer | undefined;
    readonly dueTime: number;
    readonly period: number;
    
    /**
     * @param reminderName the name of the actor reminder
     * @param state the state data passed to receiveReminder callback
     * @param dueTime the amount of time to delay before invoking the reminder for the first time
     * @param period the time interval between reminder invocations after the first invocation
     */
    constructor(reminderName: string, dueTime: number, period: number, state?: Buffer) {
        this.reminderName = reminderName;
        this.dueTime = dueTime;
        this.period = period;
        this.state = state;
    }

    getReminderName(): string {
        return this.reminderName;
    }

    getState(): Buffer | undefined {
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
            data: this.state?.toString("base64")
        }
    }

    static fromObject(reminderName: string, obj: object): ActorReminderData {
        // @ts-ignore
        const { data, due_time, period } = obj;
        
        let stateBytes;
        if (data?.length > 0) {
            stateBytes = Buffer.from(data, 'base64');
        }

        return new ActorReminderData(reminderName, due_time, period, stateBytes);
    }
}