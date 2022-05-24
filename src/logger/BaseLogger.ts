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

import { LogLevel } from "./LogLevel";

export abstract class BaseLogger {

    abstract log(level: LogLevel, eventId: number, error?: Error, message?: string, ...params: any[]): void;

    /**
     * Log an error message.
     * Example, logger.error("Failed to load '{0}'", fileName);
     *
     * @param message Error message.
     * @param params  Format parameters.
     */
    error(message: string, ...params: any[]): void;

    /**
     * Log an error object along with a message.
     * Example, logger.error(err, "Failed to load '{0}'", fileName);
     * 
     * @param error Error object.
     * @param message Error message.
     * @param params Format parameters.
     */
    error(error: Error, message: string, ...params: any[]): void;

    /**
     * Log an error message with an event ID.
     * Example, logger.error(FILENAME_LOAD_ERROR, "Failed to load '{0}'", fileName);
     * 
     * @param eventId Event ID of the log entry.
     * @param message Error message.
     * @param params Format parameters.
     */
    error(eventId: number, message: string, ...params: any[]): void;

    /**
     * Log an error object along with a message and event ID.
     * Example, logger.error(FILENAME_LOAD_ERROR, err, "Failed to load '{0}'", fileName);
     * 
     * @param eventId Event ID of the log entry.
     * @param error Error object.
     * @param message Error message.
     * @param params Format parameters.
     */
    error(eventId: number, error: Error, message: string, ...params: any[]): void;
    error(...args: 
        [message: string, ...params: any[]] | 
        [error: Error, message: string, ...params: any[]] | 
        [eventId: number, message: string, ...params: any[]] | 
        [eventId: number, error: Error, message: string, ...params: any[]]): void {

    }

    /**
     * Log a warning message.
     * Example, logger.warn("Unable to load '{0}'", fileName);
     * 
     * @param message Warning message.
     * @param params Format parameters.
     */
    warn(message: string, ...params: any[]): void;

    /**
     * Log a warning with an error object and a message.
     * Example, logger.warn(err, "Unable to load '{0}'", fileName);
     * 
     * @param error Error object.
     * @param message Warning message.
     * @param params Format parameters.
     */
    warn(error: Error, message: string, ...params: any[]): void;

    /**
     * Log a warning message with an event ID.
     * Example, logger.warn(FILENAME_LOAD_ERROR, "Unable to load '{0}'", fileName);
     * 
     * @param eventId Event ID of the log entry.
     * @param message Warning message.
     * @param params Format parameters.
     */
    warn(eventId: number, message: string, ...params: any[]): void;

    /**
     * Log a warning with an error object, a message and an event ID.
     * Example, logger.warn(FILENAME_LOAD_ERROR, err, "Unable to load '{0}'", fileName);
     * 
     * @param eventId Event ID of the log entry.
     * @param error Error object.
     * @param message Warning message.
     * @param params Format parameters.
     */
    warn(eventId: number, error: Error, message: string, ...params: any[]): void;

    warn(...args: 
        [message: string, ...params: any[]] |
        [error: Error, message: string, ...params: any[]] |
        [eventId: number, message: string, ...params: any[]] |
        [eventId: number, error: Error, message: string, ...params: any[]]): void {
    }

    /**
     * Log an info message.
     * Example, logger.info("Loading '{0}'", fileName);
     * 
     * @param message Info message.
     * @param params Format parameters.
     */
    info(message: string, ...params: any[]): void;

    /**
     * Log an info message with an error object.
     * Example, logger.info(err, "Loading '{0}'", fileName);
     * 
     * @param error Error object.
     * @param message Info message.
     * @param params Format parameters.
     */
    info(error: Error, message: string, ...params: any[]): void;

    /**
     * Log an info message with an event ID.
     * Example, logger.info(FILENAME_LOAD_EVENT, "Loading '{0}'", fileName);
     * 
     * @param eventId Event ID of the log entry.
     * @param message Info message.
     * @param params Format parameters.
     */
    info(eventId: number, message: string, ...params: any[]): void;

    /**
     * Log an info message with an error object and an event ID.
     * Example, logger.info(FILENAME_LOAD_FALLBACK, err, "Falling back to '{0}'", fileName);
     * 
     * @param eventId Event ID of the log entry.
     * @param error Error object.
     * @param message Info message.
     * @param params Format parameters.
     */
    info(eventId: number, error: Error, message: string, ...params: any[]): void;

    info(...args:
        [message: string, ...params: any[]] |
        [error: Error, message: string, ...params: any[]] |
        [eventId: number, message: string, ...params: any[]] |
        [eventId: number, error: Error, message: string, ...params: any[]]): void {
    }

    /**
     * Log a debug message.
     * Example, logger.debug("Returning '{0}' from '{1}'", result, funcName);
     * 
     * @param message Debug message.
     * @param params Format parameters.
     */
    debug(message: string, ...params: any[]): void;

    /**
     * Log a debug message with an error object.
     * Example, logger.debug(err, "Error returning '{0}' from '{1}'", result, funcName);
     *
     * @param error Error object.
     * @param message Debug message.
     * @param params Format parameters.
     */
    debug(error: Error, message: string, ...params: any[]): void;

    /**
     * Log a debug message with an event ID.
     * Example, logger.debug(FILENAME_LOAD_EVENT, "Loading '{0}'", fileName);
     * 
     * @param eventId Event ID of the log entry.
     * @param message Debug message.
     * @param params Format parameters.
     */
    debug(eventId: number, message: string, ...params: any[]): void;

    /**
     * Log a debug message with an error object and an event ID.
     * Example, logger.debug(FILENAME_LOAD_ERROR, err, "Error returning '{0}' from '{1}'", result, funcName);
     * 
     * @param eventId Event ID of the log entry.
     * @param error Error object.
     * @param message Debug message.
     * @param params Format parameters.
     */
    debug(eventId: number, error: Error, message: string, ...params: any[]): void;

    debug(...args:
        [message: string, ...params: any[]] |
        [error: Error, message: string, ...params: any[]] |
        [eventId: number, message: string, ...params: any[]] |
        [eventId: number, error: Error, message: string, ...params: any[]]): void {
    }

    /**
     * Log a trace message.
     * Example, logger.trace("Entering '{0}'", funcName);
     * 
     * @param message Trace message.
     * @param params Format parameters.
     */
    trace(message: string, ...params: any[]): void;

    /**
     * Log a trace message with an error object.
     * Example, logger.trace(err, "Error entering '{0}'", funcName);
     * 
     * @param error Error object.
     * @param message Trace message.
     * @param params Format parameters.
     */
    trace(error: Error, message: string, ...params: any[]): void;

    /**
     * Log a trace message with an event ID.
     * Example, logger.trace(FILENAME_LOAD_EVENT, "Loading '{0}'", fileName);
     * 
     * @param eventId Event ID of the log entry.
     * @param message Trace message.
     * @param params Format parameters.
     */
    trace(eventId: number, message: string, ...params: any[]): void;

    /**
     * Log a trace message with an error object and an event ID.
     * Example, logger.trace(FILENAME_LOAD_ERROR, err, "Error loading '{0}'", fileName);
     * 
     * @param eventId Event ID of the log entry.
     * @param error Error object.
     * @param message Trace message.
     * @param params Format parameters.
     */
    trace(eventId: number, error: Error, message: string, ...params: any[]): void;

    trace(...args:
        [message: string, ...params: any[]] |
        [error: Error, message: string, ...params: any[]] |
        [eventId: number, message: string, ...params: any[]] |
        [eventId: number, error: Error, message: string, ...params: any[]]): void {
    }
}
