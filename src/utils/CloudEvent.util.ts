/**
 * Checks if the input object is a valid Cloud Event.
 * A valid Cloud Event is a JSON object that contains id, source, type, and specversion.
 * See https://github.com/cloudevents/spec/blob/v1.0/spec.md#required-attributes
 * @param str input object
 * @returns true if the object is a valid Cloud Event
 */
export function isCloudEvent(obj: object): boolean {
  const requiredAttributes = ["id", "source", "type", "specversion"];

  return (
    typeof obj === "object" &&
    obj !== null &&
    requiredAttributes.every((attr) => {
      return Object.prototype.hasOwnProperty.call(obj, attr);
    })
  );
}
