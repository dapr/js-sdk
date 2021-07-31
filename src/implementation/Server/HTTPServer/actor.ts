import HTTPServer from './HTTPServer';
import IServerActor from '../../../interfaces/Server/IServerActor';
import AbstractActor from '../../../actors/runtime/AbstractActor';
import Class from '../../../types/Class';
import ActorRuntime from '../../../actors/runtime/ActorRuntime';
import DaprClient from '../../Client/DaprClient';
import IRequest from '../../../types/http/IRequest';
import IResponse from '../../../types/http/IResponse';

// https://docs.dapr.io/reference/api/bindings_api/
export default class HTTPServerActor implements IServerActor {
  server: HTTPServer;
  client: DaprClient;

  constructor(server: HTTPServer) {
      this.server = server;
      this.client = new DaprClient(this.server.serverHost, this.server.serverPort);
  }

  async registerActor<T extends AbstractActor>(cls: Class<T>): Promise<void> {
    ActorRuntime.getInstance(this.client).registerActor(cls);
    console.log(`Registering actor ${cls.name}`);
  }
  
  async getRegisteredActors(): Promise<string[]> {
    return await ActorRuntime.getInstance(this.client).getRegisteredActorTypes();
  }

  /**
   * Initialize actors in the HTTP Server
   * This will create the routes that get invoked by the Dapr Sidecar
   */
  async init(): Promise<void> {
    // @todo: are these actor specific or SDK specific?
    // this.server.getServer().get("/healthz");
    // this.server.getServer().get("/dapr/config");

    this.server.getServer().delete("/actors/:actorTypeName/:actorId", this.handlerDeactivate);
    this.server.getServer().put("/actors/:actorTypeName/:actorId/method/:methodName", this.handlerMethod);
    this.server.getServer().put("/actors/:actorTypeName/:actorId/method/timer/:timerName", this.handlerTimer);
    this.server.getServer().put("/actors/:actorTypeName/:actorId/method/remind/:reminderName", this.handlerReminder);
  }

  private async handlerDeactivate(req: IRequest, res: IResponse): Promise<void> {
    const { actorTypeName, actorId } = req.params;

  }

  private async handlerMethod(req: IRequest, res: IResponse): Promise<Buffer> {
    const { actorTypeName, actorId, methodName } = req.params;
    const body = req.body;

    // @todo: reentrancy id? (https://github.com/dapr/python-sdk/blob/master/ext/flask_dapr/flask_dapr/actor.py#L91)

    const result = await ActorRuntime.getInstance(this.client).invoke(actorTypeName, actorId, methodName, Buffer.from(JSON.stringify(body)));
    return result;
  }

  private async handlerTimer(req: IRequest, res: IResponse): Promise<void> {
    const { actorTypeName, actorId, timerName } = req.params;

  }

  private async handlerReminder(req: IRequest, res: IResponse): Promise<void> {
    const { actorTypeName, actorId, remindername } = req.params;

  }
}
