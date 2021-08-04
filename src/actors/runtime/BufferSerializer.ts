export default class BufferSerializer {
  // constructor() {
  // }

  deserialize(data: Buffer): string | object {
    let deserializedBody: string | object = data?.toString() || "";

    // Try to parse it to an object
    // this way manager.invoke has string | object
    try {
      deserializedBody = JSON.parse(deserializedBody);
    } catch (e) {
      // Do nothing
    }

    return deserializedBody;
  }

  serialize(data: any): Buffer {
    let dataAsString: string;

    if (typeof data === "object") {
      dataAsString = JSON.stringify(data);
    } else {
      dataAsString = data?.toString() || "";
    }

    return Buffer.from(dataAsString);
  }
}