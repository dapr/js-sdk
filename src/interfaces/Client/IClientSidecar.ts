export default interface IClientSidecar {
  shutdown(): Promise<void>;
}