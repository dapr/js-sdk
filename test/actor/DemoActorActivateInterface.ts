export default interface DemoActorActivateInterface {
  getIsActivated(): Promise<boolean>;
  getIsDeactivated(): Promise<boolean>;
  getDeactivatedCallCount(): Promise<number>;
  getActivatedCallCount(): Promise<number>;
}