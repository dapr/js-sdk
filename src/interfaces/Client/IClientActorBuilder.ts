import Class from "../../types/Class";

export default interface IClientActor {
  create<T>(actorTypeClass: Class<T>): T;
}