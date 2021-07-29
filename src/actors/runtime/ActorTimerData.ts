/**
 * Contains the actor reminder data
 */
export default class ActorTimerData {
    readonly timerName: string;
    readonly state: Buffer | undefined;
    readonly callback: string;
    
    /**
     * @param reminderName the name of the actor reminder
     * @param state the state data passed to receiveReminder callback
     * @param callback the callback method to call
     */
    constructor(timerName: string, callback: string, state?: Buffer) {
        this.timerName = timerName;
        this.callback = callback;
        this.state = state;
    }

    getTimerName(): string {
        return this.timerName;
    }

    getState(): Buffer | undefined {
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
            data: this.state?.toString("base64")
        }
    }

    static fromObject(reminderName: string, obj: object): ActorTimerData {
        // @ts-ignore
        const { data, callback } = obj;
        
        let stateBytes;
        if (data?.length > 0) {
            stateBytes = Buffer.from(data, 'base64');
        }

        return new ActorTimerData(reminderName, callback, stateBytes);
    }
}