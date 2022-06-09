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

import { LoggerService } from "./LoggerService"
import { LogLevel } from "./LogLevel"

/**
 * LoggerOptions provides options for configuring the logger.
 */
export type LoggerOptions = {
    /**
     * The minimum level of messages to log.
     * Default is LogLevel.Info.
     */
    level?: LogLevel
    /**
     * Logging implementation to use.
     * Default is to use the console.
     */
    service?: LoggerService
}