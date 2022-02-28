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


enum StateChangeKind {
    // No change in state
    NONE = 0,
    // The state needs to be added
    ADD = 1,
    // The state needs to be updated
    UPDATE = 2,
    // The state needs to be removed
    REMOVE = 3
}

export default StateChangeKind;