import AbstractActor from "../../actors/runtime/AbstractActor";
import Class from "../../types/Class";
import IResponse from "../../types/http/IResponse";
import IRequest from "../../types/http/IRequest";

export default interface IServerActor {
    registerActor<T extends AbstractActor>(cls: Class<T>): Promise<void>;
    getRegisteredActors(): Promise<string[]>;
    init(): Promise<void>;
    deactivateActor(actorType: string, actorId: string): Promise<void>;

    // @todo: do we want those in the interface? init should take care of it
    // handlerDeactivate(req: IRequest, res: IResponse): Promise<void>;
    // handlerMethod(req: IRequest, res: IResponse): Promise<void>;
    // handlerTimer(req: IRequest, res: IResponse): Promise<void>;
    // handlerReminder(req: IRequest, res: IResponse): Promise<void>;
}