import { GetBulkSecretRequest, GetBulkSecretResponse, GetSecretRequest, GetSecretResponse } from "../../proto/dapr/proto/runtime/v1/dapr_pb";
import IClientSecretStrategy from "../IClientSecretStrategy";
import GRPCClient from './GRPCClient';

// https://docs.dapr.io/reference/api/secrets_api/
export default class DaprSecret implements IClientSecretStrategy {
    client: GRPCClient;

    constructor(client: GRPCClient) {
        this.client = client;
    }

    // @todo: implement metadata
    async get(secretStoreName: string, key: string, metadata: string = ""): Promise<object> {
        const msgService = new GetSecretRequest();
        msgService.setStoreName(secretStoreName);
        msgService.setKey(key);

        return new Promise(async (resolve, reject) => {
            const client = this.client.getClient();
            client.getSecret(msgService, (err, res: GetSecretResponse) => {
                if (err) {
                    return reject(err);
                }

                // Convert [ [ 'TEST_SECRET_1', 'secret_val_1' ] ] => [ { TEST_SECRET_1: 'secret_val_1' } ]
                const items = res.getDataMap().getEntryList().map((item) => ({ [item[0]]: item[1] }));

                // Return first item (it's a single get)
                return resolve(items[0]);
            });
        })
    }

    async getBulk(secretStoreName: string): Promise<object> {
        const msgService = new GetBulkSecretRequest();
        msgService.setStoreName(secretStoreName);

        return new Promise(async (resolve, reject) => {
            const client = this.client.getClient();
            client.getBulkSecret(msgService, (err, res: GetBulkSecretResponse) => {
                if (err) {
                    return reject(err);
                }

                // https://docs.dapr.io/reference/api/secrets_api/#response-body-1
                // @ts-ignore
                // tslint:disable-next-line
                return resolve(res.getDataMap()["map_"]);
            });
        })
    }
}
