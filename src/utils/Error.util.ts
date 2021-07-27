export default class ErrorUtil {
  static serializeError(msg: any): never {
    if (typeof msg === "string") {
      throw new Error(msg);
    }

    throw new Error(JSON.stringify(msg));
  }
}