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

import { LoggerOptions } from "../types/logger/LoggerOptions";
import { LoggerService } from "../types/logger/LoggerService";
import { LogLevel } from "../types/logger/LogLevel";
import { ConsoleLoggerService } from "./ConsoleLoggerService";

export class Logger {
    private readonly logLevel: LogLevel;
    private readonly logService: LoggerService;

    /**
     * Creates a new instance of the Logger class.
     * If an options is missing, it falls back to the default values.
     * The default log level is 'info'.
     * The default log service is the ConsoleLoggerService.
     * @param options Logger options
     */
    constructor(options?: LoggerOptions) {
        if (options !== undefined && options.level !== undefined) {
            this.logLevel = options.level;
        } else {
            this.logLevel = LogLevel.Info;
        }

        if (options !== undefined && options.service !== undefined) {
            this.logService = options.service;
        } else {
            this.logService = new ConsoleLoggerService();
        }
    }

    error(component: string, area: string, message: any, ...optionalParams: any[]): void {
        if (this.logLevel >= LogLevel.Error) {
            this.logService.error(`[${component}, ${area}] ${message}`, ...optionalParams);
        }
    }

    warn(component: string, area: string, message: any, ...optionalParams: any[]): void {
        if (this.logLevel >= LogLevel.Warn) {
            this.logService.warn(`[${component}, ${area}] ${message}`, ...optionalParams);
        }
    }

    info(component: string, area: string, message: any, ...optionalParams: any[]): void {
        if (this.logLevel >= LogLevel.Info) {
            this.logService.info(`[${component}, ${area}] ${message}`, ...optionalParams);
        }
    }

    verbose(component: string, area: string, message: any, ...optionalParams: any[]): void {
        if (this.logLevel >= LogLevel.Verbose) {
            this.logService.verbose(`[${component}, ${area}] ${message}`, ...optionalParams);
        }
    }

    debug(component: string, area: string, message: any, ...optionalParams: any[]): void {
        if (this.logLevel >= LogLevel.Debug) {
            this.logService.debug(`[${component}, ${area}]: ${message}`, ...optionalParams);
        }
    }
}