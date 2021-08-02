import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Any } from "google-protobuf/google/protobuf/any_pb";
import { ExecuteActorStateTransactionRequest, GetActorStateRequest, GetActorStateResponse, GetMetadataResponse, InvokeActorRequest, InvokeActorResponse, RegisterActorReminderRequest, RegisterActorTimerRequest, TransactionalActorStateOperation, UnregisterActorReminderRequest, UnregisterActorTimerRequest } from '../../../proto/dapr/proto/runtime/v1/dapr_pb';
import GRPCClient from './GRPCClient';
import { OperationType } from '../../../types/Operation.type';
import { ActorReminderType } from '../../../types/ActorReminder.type';
import { ActorTimerType } from '../../../types/ActorTimer.type';
import IClientActor from '../../../interfaces/Client/IClientActor';
import { KeyValueType } from '../../../types/KeyValue.type';
import { AbstractActor } from "../../..";
import Class from "../../../types/Class";

// https://docs.dapr.io/reference/api/actors_api/
export default class GRPCClientActor implements IClientActor {
    client: GRPCClient;

    constructor(client: GRPCClient) {
        this.client = client;
    }

    createProxy<T extends AbstractActor>(actorType: Class<T>, actorId: string): Promise<T> {
        throw new Error("Method not implemented since the actor runtime is not supported on gRPC");
    }

    async invoke(method: "GET" | "POST" | "PUT" | "DELETE", actorType: string, actorId: string, methodName: string, body?: any): Promise<object> {
        const msgService = new InvokeActorRequest();
        msgService.setActorId(actorId)
        msgService.setActorType(actorType);
        msgService.setMethod(methodName);

        if (body) {
            // @todo: if body is any, do we have to figure out how to serialize in JS? (e.g. if object -> JSON.stringify?)
            msgService.setData(body);
        }

        return new Promise(async (resolve, reject) => {
            const client = this.client.getClient();
            client.invokeActor(msgService, (err, res: InvokeActorResponse) => {
                if (err) {
                    return reject(err);
                }

                // https://docs.dapr.io/reference/api/secrets_api/#response-body
                const resData = Buffer.from(res.getData()).toString();

                try {
                    return resolve(JSON.parse(resData));
                } catch (e) {
                    return resolve(resData as any);
                }
            });
        });
    }

    async stateTransaction(actorType: string, actorId: string, operations: OperationType[]): Promise<void> {
        const transactionItems: TransactionalActorStateOperation[] = [];

        for (const o of operations) {
            const transactionItem = new TransactionalActorStateOperation();
            transactionItem.setKey(o.request.key);
            transactionItem.setOperationtype(o.operation);

            const msgSerialized = new Any();
            msgSerialized.setValue(Buffer.from(`${o.request.value}`, "utf-8"));
            transactionItem.setValue(msgSerialized);

            transactionItems.push(transactionItem);
        }

        const msgService = new ExecuteActorStateTransactionRequest();
        msgService.setActorType(actorType);
        msgService.setActorId(actorId);
        msgService.setOperationsList(transactionItems);

        return new Promise(async (resolve, reject) => {
            const client = this.client.getClient();
            client.executeActorStateTransaction(msgService, (err, res) => {
                if (err) {
                    return reject(err);
                }

                // https://docs.dapr.io/reference/api/state_api/#request-body-1
                return resolve();
            });
        });
    }

    async stateGet(actorType: string, actorId: string, key: string): Promise<KeyValueType | string> {
        const msgService = new GetActorStateRequest();
        msgService.setActorType(actorType);
        msgService.setActorId(actorId)
        msgService.setKey(key);

        return new Promise(async (resolve, reject) => {
            const client = this.client.getClient();
            client.getActorState(msgService, (err, res: GetActorStateResponse) => {
                if (err) {
                    return reject(err);
                }

                // https://docs.dapr.io/reference/api/actors_api/#http-response-codes-2
                const resData = Buffer.from(res.getData()).toString();

                try {
                    const json = JSON.parse(resData);
                    return resolve(json);
                } catch (e) {
                    return resolve(resData);
                }
            });
        });
    }

    async reminderCreate(actorType: string, actorId: string, name: string, reminder: ActorReminderType): Promise<void> {
        const msgService = new RegisterActorReminderRequest();
        msgService.setActorType(actorType);
        msgService.setActorId(actorId);
        msgService.setName(name);

        if (reminder.data) {
            msgService.setData(Buffer.from(reminder?.data.toString(), "utf-8"))
        }

        if (reminder.period) {
            msgService.setPeriod(reminder.period.toString());
        }

        if (reminder.dueTime) {
            msgService.setDueTime(reminder.dueTime.toString());
        }

        return new Promise(async (resolve, reject) => {
            const client = this.client.getClient();
            client.registerActorReminder(msgService, (err, res) => {
                if (err) {
                    return reject(err);
                }

                // https://docs.dapr.io/reference/api/actors_api/#http-response-codes-3
                return resolve();
            });
        });
    }

    // @todo: not implemented, cannot find the gRPC bindings
    // async reminderGet(actorType: string, actorId: string, name: string): Promise<void> {
    //     const msgService = new RegisterActorReminderRequest();
    //     msgService.setActorType(actorType);
    //     msgService.setActorId(actorId);
    //     msgService.setName(name);

    //     if (reminder.data) {
    //         msgService.setData(Buffer.from(reminder.data, "utf-8"))
    //     }

    //     if (reminder.period) {
    //         msgService.setPeriod(reminder.period);
    //     }

    //     if (reminder.dueTime) {
    //         msgService.setDueTime(reminder.dueTime);
    //     }

    //     return new Promise(async (resolve, reject) => {
    //         const client = await GRPCClientSingleton.getClient();
    //         client.registerActorReminder(msgService, (err, res) => {
    //             if (err) {
    //                 return reject(err);
    //             }

    //             // https://docs.dapr.io/reference/api/actors_api/#http-response-codes-3
    //             return resolve();
    //         });
    //     });
    // }

    async reminderDelete(actorType: string, actorId: string, name: string): Promise<void> {
        const msgService = new UnregisterActorReminderRequest();
        msgService.setActorType(actorType);
        msgService.setActorId(actorId);
        msgService.setName(name);

        return new Promise(async (resolve, reject) => {
            const client = this.client.getClient();
            client.unregisterActorReminder(msgService, (err, res) => {
                if (err) {
                    return reject(err);
                }

                // https://docs.dapr.io/reference/api/actors_api/#delete-actor-reminder
                return resolve();
            });
        });
    }

    async timerCreate(actorType: string, actorId: string, name: string, timer: ActorTimerType): Promise<void> {
        const msgService = new RegisterActorTimerRequest();
        msgService.setActorType(actorType);
        msgService.setActorId(actorId);
        msgService.setName(name);

        if (timer.callback) {
            msgService.setCallback(timer.callback);
        }

        if (timer.data) {
            msgService.setData(Buffer.from(timer.data, "utf-8"))
        }

        if (timer.period) {
            msgService.setPeriod(timer.period.toString());
        }

        if (timer.dueTime) {
            msgService.setDueTime(timer.dueTime.toString());
        }

        return new Promise(async (resolve, reject) => {
            const client = this.client.getClient();
            client.registerActorTimer(msgService, (err, res) => {
                if (err) {
                    return reject(err);
                }

                // https://docs.dapr.io/reference/api/actors_api/#http-response-codes-3
                return resolve();
            });
        });
    }

    async timerDelete(actorType: string, actorId: string, name: string): Promise<void> {
        const msgService = new UnregisterActorTimerRequest();
        msgService.setActorType(actorType);
        msgService.setActorId(actorId);
        msgService.setName(name);

        return new Promise(async (resolve, reject) => {
            const client = this.client.getClient();
            client.unregisterActorTimer(msgService, (err, res) => {
                if (err) {
                    return reject(err);
                }

                // https://docs.dapr.io/reference/api/actors_api/#delete-actor-timer
                return resolve();
            });
        });
    }

    // @todo: cannot find this one
    // async deactivate(actorType: string, actorId: string): Promise<ResActorDeactivateDto> {
    //     const msgService = new UnregisterActorTimerRequest();
    //     msgService.setActorType(actorType);
    //     msgService.setActorId(actorId);
    //     msgService.setName(name);

    //     return new Promise(async (resolve, reject) => {
    //         const client = await GRPCClientSingleton.getClient();
    //         client.unregisterActorTimer(msgService, (err, res) => {
    //             if (err) {
    //                 return reject(err);
    //             }

    //             // https://docs.dapr.io/reference/api/actors_api/#delete-actor-timer
    //             return resolve();
    //         });
    //     });
    // }

    async getActors(): Promise<object> {
        return new Promise(async (resolve, reject) => {
            const client = this.client.getClient();

            client.getMetadata(new Empty(), (err, res: GetMetadataResponse) => {
                if (err) {
                    return reject(err);
                }

                // https://docs.dapr.io/reference/api/actors_api/#http-response-codes-2
                return resolve(res.getActiveActorsCountList());
            });
        });
    }
}
