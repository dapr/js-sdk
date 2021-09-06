import HTTPServer from './HTTPServer';
import IServerActor from '../../../interfaces/Server/IServerActor';
import AbstractActor from '../../../actors/runtime/AbstractActor';
import Class from '../../../types/Class';
import ActorRuntime from '../../../actors/runtime/ActorRuntime';
import IRequest from '../../../types/http/IRequest';
import IResponse from '../../../types/http/IResponse';
import { GetRegisteredActorsType } from '../../../types/response/GetRegisteredActors.type';
import BufferSerializer from '../../../actors/runtime/BufferSerializer';
import HTTPClient from '../../Client/HTTPClient/HTTPClient';

// https://docs.dapr.io/reference/api/bindings_api/
export default class HTTPServerActor implements IServerActor {
  private readonly server: HTTPServer;
  private readonly client: HTTPClient;
  private readonly serializer: BufferSerializer;

  constructor(server: HTTPServer, client: HTTPClient) {
    this.client = client;
    this.server = server;
    this.serializer = new BufferSerializer();
  }

  async deactivateActor(actorType: string, actorId: string): Promise<void> {
    await this.client.execute(`http://localhost:${this.server.serverPort}/actors/${actorType}/${actorId}`, { method: "DELETE" });
  }

  async registerActor<T extends AbstractActor>(cls: Class<T>): Promise<void> {
    ActorRuntime.getInstance(this.client).registerActor(cls);
  }

  async getRegisteredActors(): Promise<string[]> {
    return await ActorRuntime.getInstance(this.client).getRegisteredActorTypes();
  }

  /**
   * Initialize actors in the HTTP Server
   * This will create the routes that get invoked by the Dapr Sidecar
   */
  async init(): Promise<void> {
    // Change the server startupDelay to 3s since we want the placement tables to get updated correctly
    // @todo: is there a better way to detect this?
    this.server.serverStartupDelay = 4000;
    console.log("[Actors] Initializing, changing startup delay to 4s to allow for placement tables to propagate");

    // Probes the application for a response to state that the app is healthy and running
    // https://docs.dapr.io/reference/api/actors_api/#health-check
    this.server.getServer().get("/healthz", this.handlerHealth.bind(this));

    // https://docs.dapr.io/reference/api/actors_api/#get-registered-actors
    this.server.getServer().get("/dapr/config", this.handlerConfig.bind(this));

    this.server.getServer().delete("/actors/:actorTypeName/:actorId", this.handlerDeactivate.bind(this));
    this.server.getServer().put("/actors/:actorTypeName/:actorId/method/:methodName", this.handlerMethod.bind(this));
    this.server.getServer().put("/actors/:actorTypeName/:actorId/method/timer/:timerName", this.handlerTimer.bind(this));
    this.server.getServer().put("/actors/:actorTypeName/:actorId/method/remind/:reminderName", this.handlerReminder.bind(this));
  }

  private async handlerHealth(req: IRequest, res: IResponse): Promise<void> {
    return res.send("ok");
  }

  private async handlerConfig(req: IRequest, res: IResponse): Promise<void> {
    const actorRuntime = ActorRuntime.getInstance(this.client);

    const result: GetRegisteredActorsType = {
      entities: actorRuntime.getRegisteredActorTypes(),
      ...actorRuntime.getActorRuntimeConfig().toDictionary()
    }

    return res.send(result);
  }

  private async handlerDeactivate(req: IRequest, res: IResponse): Promise<void> {
    const { actorTypeName, actorId } = req.params;
    const result = await ActorRuntime.getInstance(this.client).deactivate(actorTypeName, actorId);
    return this.handleResult(res, result);
  }

  private async handlerMethod(req: IRequest, res: IResponse): Promise<void> {
    const { actorTypeName, actorId, methodName } = req.params;
    const body = req.body;

    // @todo: reentrancy id? (https://github.com/dapr/python-sdk/blob/master/ext/flask_dapr/flask_dapr/actor.py#L91)

    const dataSerialized = this.serializer.serialize(body);
    const result = await ActorRuntime.getInstance(this.client).invoke(actorTypeName, actorId, methodName, dataSerialized);
    return this.handleResult(res, result);
  }

  private async handlerTimer(req: IRequest, res: IResponse): Promise<void> {
    const { actorTypeName, actorId, timerName } = req.params;
    const body = req.body;

    const dataSerialized = this.serializer.serialize(body);
    const result = await ActorRuntime.getInstance(this.client).fireTimer(actorTypeName, actorId, timerName, dataSerialized);
    return res.send(result, 200);
  }

  private async handlerReminder(req: IRequest, res: IResponse): Promise<void> {
    const { actorTypeName, actorId, reminderName } = req.params;
    const body = req.body;

    const dataSerialized = this.serializer.serialize(body);
    const result = await ActorRuntime.getInstance(this.client).fireReminder(actorTypeName, actorId, reminderName, dataSerialized);
    return res.send(result, 200);
  }

  private handleResult(res: IResponse, result: any) {
    if (result && typeof result === "object") {
      return res.send(result, 200);
    } else {
      // @ts-ignore
      return res.send(`${result}`, 200);
    }
  }
}
