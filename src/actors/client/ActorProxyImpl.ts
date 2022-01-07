import Class from "../../types/Class";
import ActorClient from "./ActorClient/ActorClient";
import ActorId from "../ActorId";

export default class ActorProxyImpl<T> {
  actorClient: ActorClient;
  actorTypeClass: Class<T>;
  actorId: ActorId;

  constructor(actorTypeClass: Class<T>, actorId: ActorId, actorClient: ActorClient) {
    this.actorTypeClass = actorTypeClass;
    this.actorClient = actorClient;
    this.actorId = actorId;
  }
}