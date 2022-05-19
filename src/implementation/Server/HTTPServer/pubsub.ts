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

import { TypeDaprPubSubCallback } from '../../../types/DaprPubSubCallback.type';
import IServerPubSub from '../../../interfaces/Server/IServerPubSub';
import HTTPServer from './HTTPServer';

// https://docs.dapr.io/reference/api/pubsub_api/
export default class HTTPServerPubSub implements IServerPubSub {
  private readonly server: HTTPServer;

  constructor(server: HTTPServer) {
    this.server = server;
  }

  async subscribe(pubsubName: string, topic: string, cb: TypeDaprPubSubCallback, route = "") {
    if (!route) {
      route = `route-${pubsubName}-${topic}`;
    }

    // Register the handler
    await this.server.getServerImpl().registerPubSubSubscriptionRoute(pubsubName, topic, route);

    this.server.getServer().post(`/${route}`, async (req, res) => {
      // @ts-ignore
      // Parse the data of the body, we prioritize fetching the data key in body if possible
      // i.e. Redis returns { data: {} } and other services return {}
      // @todo: This will be deprecated in an upcoming major version and only req.body will be returned
      const data = req?.body?.data || req?.body;

      // Process our callback
      try {
        await cb(data);
      } catch (e) {
        console.error(e);
        return res.send({ success: false });
      }

      // Let Dapr know that the message was processed correctly
      // console.log(`[Dapr API][PubSub][route-${topic}] Ack'ing the message`);
      return res.send({ success: true });
    });
  }
}