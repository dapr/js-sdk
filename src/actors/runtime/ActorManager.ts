import { v4 as uuidv4 } from "uuid";
import DaprClient from "../../implementation/Client/DaprClient";
import Class from "../../types/Class";
import ActorId from "../ActorId";
import AbstractActor from "./AbstractActor";
import ActorReminderData from "./ActorReminderData";
import ActorTimerData from "./ActorTimerData";

/**
 * The Actor Manager manages actor objects of a specific actor type
 */
const TIMER_METHOD_NAME = 'fireTimer';
const REMINDER_METHOD_NAME = 'receiveReminder';

export default class ActorManager<T extends AbstractActor> {
    readonly actorCls: Class<T>;
    readonly daprClient: DaprClient;

    actors: Map<ActorId, T>;

    // dispatcher: ActorMethodDispatcher<T>;
    // timerMethodContext: any;
    // reminderMethodContext: any;

    constructor(actorCls: Class<T>, daprClient: DaprClient) {
        this.daprClient = daprClient;
        this.actorCls = actorCls;

        this.actors = new Map<ActorId, T>();

        // @todo: we need to make sure race condition cannot happen when accessing the active actors
        // NodeJS has an event loop (main thread -> runs JS code) and a worker pool (threadpool -> automatically created for offloading work through libuv) threads
        // we can have a new thread through the worker_thread module 
        // https://medium.com/@mohllal/node-js-multithreading-a5cd74958a67
        // 
        //
        // Python: asyncio.lock -> implements a mutex lock for asyncio tasks to guarantee exclusive access to a shared resource
        // Java: Collections.synchronizedMap -> is a thread-saf synchronized map to guarantee serial access
        // NodeJS: https://nodejs.org/api/worker_threads.html
        // this.activeActorsLock = null; // Unknown in JS, states: asyncio.lock() in python @todo: we need a Mutex locking function

        // this.dispatcher = new ActorMethodDispatcher(this.runtimeCtx.getActorTypeInformation());
        // this.timerMethodContext = ActorMethodContext.createForTimer(TIMER_METHOD_NAME);
        // this.reminderMethodContext = ActorMethodContext.createForReminder(REMINDER_METHOD_NAME);
    }

    // /**
    //  * Invokes a given method in the Actor
    //  * 
    //  * @param actorId Identifier for the Actor being invoked
    //  * @param actorMethodName The name of the method being invoked
    //  * @param requestBody The Input object for the method being invoked
    //  * @param actorMethodContext The method context to be invoked
    //  * @returns Promise Buffer
    //  */
    // async invokeMethod(actorId: ActorId, actorMethodName: string, requestBody: Buffer, actorMethodContext?: ActorMethodContext): Promise<Buffer> {
    //     if (!actorMethodContext) {
    //         actorMethodContext = ActorMethodContext.createForActor(actorMethodName);
    //     }

    //     const actor = await this.invoke<>(actorId, actorMethodContext, (actor) => {

    //     });

    //     // @todo
    //     return Buffer.from("");
    // }

    // /**
    //  * 
    //  * @param actorId Identifier of the Actor
    //  * @param actorMethodContext The method context for the method/timer/reminder call
    //  * @returns 
    //  */
    // async invoke(actorId: ActorId, actorMethodContext: ActorMethodContext, func: any): Promise<T> {
    //     if (!actorMethodContext) {
    //         actorMethodContext = ActorMethodContext.createForActor(actorMethodName);
    //     }

    //     // @todo
    //     return Buffer.from("");
    // }

    async getActiveActor(actorId: ActorId): Promise<T> {
        let actor = this.actors.get(actorId);

        // @todo: Create an actor if it doesn't exist
        // see https://github.com/dapr/python-sdk/blob/2183122ce14eb53e41eaaa28a94f0c3a5e6b975d/dapr/actor/runtime/manager.py#L111
        if (!actor) {
            actorId = new ActorId(uuidv4());
            actor = new this.actorCls(actorId);
            this.actors.set(actorId, actor);
        }

        // @todo: Make sure it was actually set
        // https://github.com/dapr/python-sdk/blob/2183122ce14eb53e41eaaa28a94f0c3a5e6b975d/dapr/actor/runtime/manager.py#L116
        if (!actor) {
            throw new Error(`${actorId.id} was not activated correctly`);
        }

        return actor;
    }

    /**
     * Execute the given method with requestBody on the given Actor
     * 
     * @param actorId 
     * @param actorMethodName 
     * @param requestBody 
     * @param actorMethodContext 
     * @returns 
     */
    async invoke(actorId: ActorId, actorMethodName: string, ...args: any): Promise<any> {
        return await this.callActorMethod(actorId, actorMethodName, args);
    }

    async fireReminder(actorId: ActorId, reminderName: string, requestBody?: Buffer): Promise<void> {
        // @todo: make sure we are remindable
        const requestBodyDeserialized = requestBody; // @todo: deserialize?
        const reminderData = ActorReminderData.fromObject(reminderName, requestBodyDeserialized as object);
        await this.callActorMethod(actorId, REMINDER_METHOD_NAME, reminderData.reminderName, reminderData.state, reminderData.dueTime, reminderData.period);
    }

    async fireTimer(actorId: ActorId, timerName: string, requestBody?: Buffer): Promise<void> {
        // @todo: make sure we are remindable
        const requestBodyDeserialized = requestBody; // @todo: deserialize?
        const timerData = ActorTimerData.fromObject(timerName, requestBodyDeserialized as object);
        
        await this.callActorMethod(actorId, timerData.callback, timerData.state);
    }

    // , dispatchAction: (actor: T) => Promise<Buffer>
    async callActorMethod(actorId: ActorId, actorMethodName: string, ...args: any): Promise<Buffer> {
        const actorObject = await this.getActiveActor(actorId);

        // Check if the actor method exists? Skip type-checking as it's the power of Javascript
        // @ts-ignore
        if (typeof actorObject[actorMethodName] !== "function") {
            throw new Error(JSON.stringify({
                error: 'ACTOR_METHOD_DOES_NOT_EXIST',
                errorMsg: `The actor method '${actorMethodName}' does not exist on ${this.actorCls.name}`
            }));
        }

        // Call the actor method, Skip type-checking as it's the power of Javascript
        // @ts-ignore
        const res = await actorObject[actorMethodName](args);

        return res;

        // try {
        //     // @todo: actor re-entrancy
        //     // @todo: pre action hook
        //     res = await dispatchAction(actor);
        //     // @todo: post action hook
        // } catch (e) {
        //     // @todo: on_invoke failed hook
        // }

        // return res || Buffer.from("");
    }
}