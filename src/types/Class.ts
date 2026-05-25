/*
Copyright 2022 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * Utility type representing a class constructor.
 *
 * Use this type to represent class constructors that can be instantiated with any arguments
 * and produce instances of type T. Commonly used for dependency injection, reflection,
 * and dynamic class instantiation patterns.
 *
 * @template T - The type of objects created by this class constructor. Defaults to `any`.
 *
 * @example
 * ```typescript
 * // Represent a class that creates Logger instances
 * type LoggerClass = Class<Logger>;
 * const createLogger: LoggerClass = Logger;
 *
 * // Generic function accepting a class
 * function instantiate<T>(Ctor: Class<T>): T {
 *   return new Ctor();
 * }
 *
 * // Use with service registration
 * const myService = instantiate(MyServiceClass);
 * ```
 */
declare type Class<T = any> = new (...args: any[]) => T;

export default Class;
