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

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export class FailureDetails {
  private _message: string;
  private _errorType: string;
  private _stackTrace: string | undefined;

  constructor(message: string, errorType: string, stackTrace?: string) {
    this._message = message;
    this._errorType = errorType;
    this._stackTrace = stackTrace;
  }

  get message(): string {
    return this._message;
  }

  get errorType(): string {
    return this._errorType;
  }

  get stackTrace(): string | undefined {
    return this._stackTrace;
  }
}
