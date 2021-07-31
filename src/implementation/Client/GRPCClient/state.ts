import GRPCClient from './GRPCClient';
import { DeleteStateRequest, ExecuteStateTransactionRequest, GetBulkStateRequest, GetBulkStateResponse, GetStateRequest, GetStateResponse, SaveStateRequest, TransactionalStateOperation } from '../../../proto/dapr/proto/runtime/v1/dapr_pb';
import { Etag, StateItem, StateOptions } from '../../../proto/dapr/proto/common/v1/common_pb';
import { KeyValuePairType } from '../../../types/KeyValuePair.type';
import { OperationType } from '../../../types/Operation.type';
import { IRequestMetadata } from '../../../types/RequestMetadata.type';
import IClientState from '../../../interfaces/Client/IClientState';
import { KeyValueType } from '../../../types/KeyValue.type';

// https://docs.dapr.io/reference/api/state_api/
export default class GRPCClientState implements IClientState {
    client: GRPCClient;

    constructor(client: GRPCClient) {
        this.client = client;
    }

    async save(storeName: string, stateObjects: KeyValuePairType[]): Promise<void> {
        const stateList = [];

        for (const stateObject of stateObjects) {
            const si = new StateItem();
            si.setKey(stateObject.key);
            si.setValue(Buffer.from(stateObject.value, "utf-8"));
            stateList.push(si);
        }

        const msgService = new SaveStateRequest();
        msgService.setStoreName(storeName);
        msgService.setStatesList(stateList);

        return new Promise(async (resolve, reject) => {
            const client = this.client.getClient();
            client.saveState(msgService, (err, res) => {
                if (err) {
                    return reject(err);
                }

                // https://docs.dapr.io/reference/api/state_api/#response-body
                return resolve();
            });
        });
    }

    async get(storeName: string, key: string): Promise<KeyValueType | string> {
        const msgService = new GetStateRequest();
        msgService.setStoreName(storeName);
        msgService.setKey(key)

        // @todo: https://docs.dapr.io/reference/api/state_api/#optional-behaviors
        // msgService.setConsistency()

        return new Promise(async (resolve, reject) => {
            const client = this.client.getClient();
            client.getState(msgService, (err, res: GetStateResponse) => {
                if (err) {
                    return reject(err);
                }

                // https://docs.dapr.io/reference/api/state_api/#http-response-1
                const resData = Buffer.from(res.getData()).toString();

                try {
                    const json = JSON.parse(resData);
                    return resolve(json);
                } catch (e) {
                    return resolve(resData);
                }
            });
        })
    }

    async getBulk(storeName: string, keys: string[], parallelism: number = 10, metadata: string = ""): Promise<KeyValueType[]> {
        const msgService = new GetBulkStateRequest();
        msgService.setStoreName(storeName);
        msgService.setKeysList(keys);
        msgService.setParallelism(parallelism);

        // @todo: https://docs.dapr.io/reference/api/state_api/#optional-behaviors
        // msgService.setConsistency()

        return new Promise(async (resolve, reject) => {
            const client = this.client.getClient();
            client.getBulkState(msgService, (err, res: GetBulkStateResponse) => {
                if (err) {
                    return reject(err);
                }

                // https://docs.dapr.io/reference/api/state_api/#http-response-2
                const items = res.getItemsList();

                return resolve(items.map(i => ({
                    key: i.getKey(),
                    data: Buffer.from(i.getData()).toString(),
                    etag: i.getEtag()
                })));
            });
        })
    }

    async delete(storeName: string, key: string): Promise<void> {
        const msgService = new DeleteStateRequest();
        msgService.setStoreName(storeName);
        msgService.setKey(key);

        // @todo: implement below
        // msgService.setEtag();
        // msgService.setOptions();

        return new Promise(async (resolve, reject) => {
            const client = this.client.getClient();
            client.deleteState(msgService, (err, res) => {
                if (err) {
                    return reject(err);
                }

                // https://docs.dapr.io/reference/api/state_api/#http-response-3
                return resolve();
            });
        });
    }

    async transaction(storeName: string, operations: OperationType[] = [], metadata: IRequestMetadata | null = null): Promise<void> {
        const transactionItems: TransactionalStateOperation[] = [];

        for (const o of operations) {
            const si = new StateItem();
            si.setKey(o.request.key);
            si.setValue(Buffer.from(o.request.value || "", "utf-8"));

            if (o.request.etag) {
                const etag = new Etag();
                etag.setValue(o.request.etag.toString());

                si.setEtag(etag);
            }

            if (o.request.options) {
                const so = new StateOptions();
                so.setConsistency(o.request.options.consistency as any);
                so.setConcurrency(o.request.options.concurrency as any);

                si.setOptions(so);
            }

            const transactionItem = new TransactionalStateOperation();
            transactionItem.setOperationtype(o.operation);
            transactionItem.setRequest(si);

            transactionItems.push(transactionItem);
        }

        const msgService = new ExecuteStateTransactionRequest();
        msgService.setStorename(storeName);
        msgService.setOperationsList(transactionItems);

        return new Promise(async (resolve, reject) => {
            const client = this.client.getClient();
            client.executeStateTransaction(msgService, (err, res) => {
                if (err) {
                    return reject(err);
                }

                // https://docs.dapr.io/reference/api/state_api/#request-body-1
                return resolve();
            });
        });
    }
}
