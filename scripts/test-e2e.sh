#!/usr/bin/env bash
#
# Copyright 2022 The Dapr Authors
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#     http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

./scripts/test-init.sh

# Start gRPC tests
echo "Running gRPC tests"
npm run test:e2e:grpc

# Start HTTP tests
echo "Running HTTP tests"
npm run test:e2e:http