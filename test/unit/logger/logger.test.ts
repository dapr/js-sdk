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

import { LoggerService } from "../../../src";
import { Logger } from "../../../src/logger/Logger"
import { LogLevel } from "../../../src/types/logger/LogLevel"

describe('Logger', () => {
    it('should not display logs below the set log level', () => {
        // arrange
        const mockLoggerService = new MockLoggerService();
        const errorLogger = new Logger({ level: LogLevel.Error, service: mockLoggerService })
        const infoLogger = new Logger({ level: LogLevel.Info, service: mockLoggerService })
        const debugLogger = new Logger({ level: LogLevel.Debug, service: mockLoggerService })

        // act
        callAllLogLevels(errorLogger)
        callAllLogLevels(infoLogger)
        callAllLogLevels(debugLogger)

        // assert
        expect(mockLoggerService.errorCounter).toBe(1+1+1)
        expect(mockLoggerService.warnCounter).toBe(0+1+1)
        expect(mockLoggerService.infoCounter).toBe(0+1+1)
        expect(mockLoggerService.verboseCounter).toBe(0+0+1)
        expect(mockLoggerService.debugCounter).toBe(0+0+1)
    })
})

class MockLoggerService implements LoggerService {
    public errorCounter = 0;
    public warnCounter = 0;
    public infoCounter = 0;
    public verboseCounter = 0;
    public debugCounter = 0;

    error(_message: any, ..._optionalParams: any[]): void {
        this.errorCounter++;
    }
    warn(_message: any, ..._optionalParams: any[]): void {
        this.warnCounter++;
    }
    info(_message: any, ..._optionalParams: any[]): void {
        this.infoCounter++;
    }
    verbose(_message: any, ..._optionalParams: any[]): void {
        this.verboseCounter++;
    }
    debug(_message: any, ..._optionalParams: any[]): void {
        this.debugCounter++
    }
}

function callAllLogLevels(logger: Logger) {
    logger.error("component", "area", "message")
    logger.warn("component", "area", "message")
    logger.info("component", "area", "message")
    logger.verbose("component", "area", "message")
    logger.debug("component", "area", "message")
}