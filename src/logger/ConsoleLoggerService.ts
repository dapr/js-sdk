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

import { LoggerService } from "../types/logger/LoggerService";

/**
 * ConsoleLoggerService uses the in-built console module to log messages.
 */
export class ConsoleLoggerService implements LoggerService {
  error(message: any, ...optionalParams: any[]): void {
    console.error(`${this.getTime()} ERROR ${message}`, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]): void {
    console.warn(`${this.getTime()} WARN ${message}`, ...optionalParams);
  }

  info(message: any, ...optionalParams: any[]): void {
    console.info(`${this.getTime()} INFO ${message}`, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]): void {
    console.log(`${this.getTime()} VERBOSE ${message}`, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]): void {
    console.debug(`${this.getTime()} DEBUG ${message}`, ...optionalParams);
  }

  private getTime(): string {
    return new Date().toISOString();
  }
}
