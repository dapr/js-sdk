/*
Copyright 2024 The Dapr Authors
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

// Mock for Buf-generated proto files
// This allows tests to run without ESM/CJS compatibility issues

export default {};

// Export common proto message constructors as mocks
export const create = jest.fn((schema: any, data?: any) => data || {});

// Export other commonly used proto utilities
export const fromBinary = jest.fn((schema: any, bytes: Uint8Array) => ({}));
export const toBinary = jest.fn((schema: any, message: any) => new Uint8Array());
export const toJson = jest.fn((schema: any, message: any) => ({}));
export const fromJson = jest.fn((schema: any, json: any) => ({}));
