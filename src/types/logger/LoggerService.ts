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
 * LoggerService provides an interface to log SDK messages.
 */
export interface LoggerService {

    /**
     * Write an 'error' level log.
     */
    error(message: any, ...optionalParams: any[]): void;

    /**
     * Write a 'warn' level log.
     */
    warn(message: any, ...optionalParams: any[]): void;

    /**
     * Write an 'info' level log.
     */
    info(message: any, ...optionalParams: any[]): void;

    /**
     * Write a 'verbose' level log.
     */
    verbose(message: any, ...optionalParams: any[]): void;

    /**
     * Write a 'debug' level log.
     */
    debug(message: any, ...optionalParams: any[]): void;
}