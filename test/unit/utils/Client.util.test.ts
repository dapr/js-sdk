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

import {getGRPCMetadata, getHTTPMetadataQueryParam} from "../../../src/utils/Client.util"

describe('Client.util', () => {
    describe('getGRPCMetadata', () => {
        it('converts a KeyValueType to a grpc.Metadata object', () => {
            const metadata = {
                'key1': 'value1',
                'key2': 'value2'
            };
            const grpcMetadata = getGRPCMetadata(metadata);
            expect(grpcMetadata.get('key1')).toEqual(['value1']);
            expect(grpcMetadata.get('key2')).toEqual(['value2']);
        });

        it('converts a KeyValueType to a grpc.Metadata object with empty metadata', () => {
            const metadata = {};
            const grpcMetadata = getGRPCMetadata(metadata);
            expect(grpcMetadata.toJSON()).toEqual({});
        });
    });
    describe('getHTTPMetadataQueryParam', () => {
        it('converts a KeyValueType to a HTTP query parameters', () => {
            const metadata = {
                'key1': 'value1',
                'key2': 'value2'
            };
            const queryParam = getHTTPMetadataQueryParam(metadata);
            expect(queryParam).toEqual('metadata.key1=value1&metadata.key2=value2');
        });

        it('converts a KeyValueType to a HTTP query parameters with empty metadata', () => {
            const metadata = {};
            const queryParam = getHTTPMetadataQueryParam(metadata);
            expect(queryParam).toEqual('');
        });

        it('encodes the query parameters', () => {
            const metadata = {
                'key&with=special!ch#r#cters': 'value1&value2',
                'key00': 'value3 value4'
            };
            const queryParam = getHTTPMetadataQueryParam(metadata);
            expect(queryParam).toEqual('metadata.key%26with%3Dspecial!ch%23r%23cters=value1%26value2&metadata.key00=value3%20value4');
        });
    });
});