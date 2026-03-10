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

// Mock for @bufbuild/protobuf

export const create = jest.fn((schema: any, data?: any) => data || {});
export const Empty = {};
export const AnySchema = {};
export const MethodKind = {
  Unary: 'Unary',
  ServerStreaming: 'ServerStreaming',
  ClientStreaming: 'ClientStreaming',
  BiDiStreaming: 'BiDiStreaming',
};

export default {
  create,
  Empty,
  AnySchema,
  MethodKind,
};
