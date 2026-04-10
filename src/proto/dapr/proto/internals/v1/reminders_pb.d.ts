// package: dapr.proto.internals.v1
// file: dapr/proto/internals/v1/reminders.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";

export class Reminder extends jspb.Message { 
    getActorId(): string;
    setActorId(value: string): Reminder;
    getActorType(): string;
    setActorType(value: string): Reminder;
    getName(): string;
    setName(value: string): Reminder;

    hasData(): boolean;
    clearData(): void;
    getData(): google_protobuf_any_pb.Any | undefined;
    setData(value?: google_protobuf_any_pb.Any): Reminder;
    getPeriod(): string;
    setPeriod(value: string): Reminder;

    hasRegisteredTime(): boolean;
    clearRegisteredTime(): void;
    getRegisteredTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setRegisteredTime(value?: google_protobuf_timestamp_pb.Timestamp): Reminder;
    getDueTime(): string;
    setDueTime(value: string): Reminder;

    hasExpirationTime(): boolean;
    clearExpirationTime(): void;
    getExpirationTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setExpirationTime(value?: google_protobuf_timestamp_pb.Timestamp): Reminder;
    getIsTimer(): boolean;
    setIsTimer(value: boolean): Reminder;
    getSkipLock(): boolean;
    setSkipLock(value: boolean): Reminder;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Reminder.AsObject;
    static toObject(includeInstance: boolean, msg: Reminder): Reminder.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Reminder, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Reminder;
    static deserializeBinaryFromReader(message: Reminder, reader: jspb.BinaryReader): Reminder;
}

export namespace Reminder {
    export type AsObject = {
        actorId: string,
        actorType: string,
        name: string,
        data?: google_protobuf_any_pb.Any.AsObject,
        period: string,
        registeredTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
        dueTime: string,
        expirationTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
        isTimer: boolean,
        skipLock: boolean,
    }
}

export class Reminders extends jspb.Message { 
    clearRemindersList(): void;
    getRemindersList(): Array<Reminder>;
    setRemindersList(value: Array<Reminder>): Reminders;
    addReminders(value?: Reminder, index?: number): Reminder;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Reminders.AsObject;
    static toObject(includeInstance: boolean, msg: Reminders): Reminders.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Reminders, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Reminders;
    static deserializeBinaryFromReader(message: Reminders, reader: jspb.BinaryReader): Reminders;
}

export namespace Reminders {
    export type AsObject = {
        remindersList: Array<Reminder.AsObject>,
    }
}

export class TimerFiredEvent extends jspb.Message { 

    hasFireAt(): boolean;
    clearFireAt(): void;
    getFireAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setFireAt(value?: google_protobuf_timestamp_pb.Timestamp): TimerFiredEvent;
    getTimerid(): number;
    setTimerid(value: number): TimerFiredEvent;
    getGeneration(): number;
    setGeneration(value: number): TimerFiredEvent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TimerFiredEvent.AsObject;
    static toObject(includeInstance: boolean, msg: TimerFiredEvent): TimerFiredEvent.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TimerFiredEvent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TimerFiredEvent;
    static deserializeBinaryFromReader(message: TimerFiredEvent, reader: jspb.BinaryReader): TimerFiredEvent;
}

export namespace TimerFiredEvent {
    export type AsObject = {
        fireAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
        timerid: number,
        generation: number,
    }
}
