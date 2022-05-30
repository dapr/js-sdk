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
 * LoggerExtensions is a wrapper class around LoggerService to provide additional functionality.
 */
class LoggerExtensions {
    private logger: LoggerService;
    private component: string;
    private area: string;

    constructor(logger: LoggerService, component: string, area: string) {
        this.logger = logger;
        this.component = component;
        this.area = area;
    }

    error(message: any, ...optionalParams: any[]): void {
        this.logger.error(`[${this.component}] ${this.area}: ${message}`, ...optionalParams);
    }

    warn(message: any, ...optionalParams: any[]): void {
        this.logger.warn(`[${this.component}] ${this.area}: ${message}`, ...optionalParams);
    }

    info(message: any, ...optionalParams: any[]): void {
        this.logger.info(`[${this.component}] ${this.area}: ${message}`, ...optionalParams);
    }

    verbose(message: any, ...optionalParams: any[]): void {
        this.logger.verbose(`[${this.component}] ${this.area}: ${message}`, ...optionalParams);
    }

    debug(message: any, ...optionalParams: any[]): void {
        this.logger.debug(`[${this.component}] ${this.area}: ${message}`, ...optionalParams);
    }
}