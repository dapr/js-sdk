/*
Copyright 2026 The Dapr Authors
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

import type { LoggerService } from "../../types/logger/LoggerService";

export class ReplaySafeLogger implements LoggerService {
  constructor(private readonly logger: LoggerService, private readonly isReplaying: () => boolean) {}

  error(message: unknown, ...optionalParams: unknown[]): void {
    if (!this.isReplaying()) {
      this.logger.error(message, ...optionalParams);
    }
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    if (!this.isReplaying()) {
      this.logger.warn(message, ...optionalParams);
    }
  }

  info(message: unknown, ...optionalParams: unknown[]): void {
    if (!this.isReplaying()) {
      this.logger.info(message, ...optionalParams);
    }
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    if (!this.isReplaying()) {
      this.logger.verbose(message, ...optionalParams);
    }
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    if (!this.isReplaying()) {
      this.logger.debug(message, ...optionalParams);
    }
  }
}
