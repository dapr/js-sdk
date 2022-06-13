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

import * as SerializerUtil from "../../../src/utils/Serializer.util"

describe('serializer', () => {
    it('Object should be serialized to Buffer', () => {
        const data = SerializerUtil.serializeGrpc({ Hello: 'World' });
        expect(Buffer.compare(data.serialized, Buffer.from(JSON.stringify({ Hello: 'World' })))).toEqual(0);
        expect(data.contentType).toEqual("application/json");
    });
    it('Buffer object should not be serialized again', () => {
        const data = SerializerUtil.serializeGrpc(Buffer.from('Hello World'));
        expect(Buffer.compare(data.serialized, Buffer.from('Hello World'))).toEqual(0);
        expect(data.contentType).toEqual("application/octet-stream");
    });
});