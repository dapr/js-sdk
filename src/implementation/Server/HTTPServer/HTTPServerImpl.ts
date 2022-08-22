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

import SubscribedMessageHttpResponse from "../../../enum/SubscribedMessageHttpResponse.enum";
import { Logger } from "../../../logger/Logger";
import { TypeDaprPubSubCallback } from "../../../types/DaprPubSubCallback.type";
import { LoggerOptions } from "../../../types/logger/LoggerOptions";
import { DaprPubSubSubscriptionType } from "../../../types/pubsub/DaprPubSubSubscription.type";
import { DaprPubSubSubscriptionRouteType } from "../../../types/pubsub/DaprPubSubSubscriptionRouteType.type";
import { PubSubSubscriptionOptionsType } from "../../../types/pubsub/PubSubSubscriptionOptions.type";
import { IServerType } from "./HTTPServer";

export default class HTTPServerImpl {
    private readonly server: IServerType;
    private readonly logger: Logger;

    pubsubSubscriptions: DaprPubSubSubscriptionType[];
    pubsubSubscriptionEventHandlers: { [key: string]: TypeDaprPubSubCallback[] };

    constructor(server: IServerType, loggerOptions?: LoggerOptions) {
        this.server = server;
        this.logger = new Logger("HTTPServer", "HTTPServerImpl", loggerOptions);

        this.pubsubSubscriptions = []
        this.pubsubSubscriptionEventHandlers = {};
    }

    /**
     * When we subscribe, we subscribe to a topic
     * For this topic we can define "routes" which route to a certain callback depending on the event content
     * Each of these topics are handled by a EventHandler but there can be multiple handlers per pubsubname-topic-route combination
     * 
     * We don't create the EventHandlers here but we ensure that the routes are registered and can receive POST events
     * -> we create POST /<route> endpoints for each, but we create them uniquely!
     * -> to ensure uniqueness, we just check if this.pubsubSubscriptionEventHandlers[route] is set
     * 
     * @param pubSubName 
     * @param topicName 
     * @param cb 
     * @param options 
     */
    registerPubsubSubscription(pubsubName: string, topic: string, options: PubSubSubscriptionOptionsType = {}): void {
        // Create event handlers for the different routes
        // If we provide a routes array, multiple routes should be added based on rules and a default
        if (options.routes) {
            for (const route of options.routes) {
                this.registerPubsubSubscriptionRoute(pubsubName, topic, route)
            }
        }
        else if (!options.routes && options.route && typeof options.route !== "string") {
            this.registerPubsubSubscriptionRoute(pubsubName, topic, options.route);
        }
        else if (!options.routes && options.route && typeof options.route === "string") {
            this.registerPubsubSubscriptionEventHandler(pubsubName, topic, options.route);
        } else {
            // Use a default route name
            this.registerPubsubSubscriptionEventHandler(pubsubName, topic, "default");
        }

        // Register the subscription, we will return this in the /dapr/subscribe endpoint
        // this will let dapr know that we have subscriptions
        // Note: we internally translate the provided /example to -> /<pubsubname>-<topic>-example 
        //       or if empty to /<pubsubname>-<topic>-default
        this.pubsubSubscriptions.push({
            pubsubName: pubsubName,
            topic: topic,
            metadata: options.metadata,
            route: (!options.routes && this.generatePubsubSubscriptionEventHandlerKey(pubsubName, topic, options.route)) || undefined,
            routes: options.routes?.map(i => ({
                default: this.generatePubsubSubscriptionEventHandlerKey(pubsubName, topic, i.default),
                rule: i.rule?.map(r => ({
                    match: r.match,
                    path: this.generatePubsubSubscriptionEventHandlerKey(pubsubName, topic, r.path)
                }))
            })),
            deadLetterTopic: options.deadLetterTopic
        })
    }

    registerPubsubSubscriptionRoute(pubsubName: string, topic: string, route: DaprPubSubSubscriptionRouteType): void {
        // Register the default route if required
        if (route.default) {
            this.registerPubsubSubscriptionEventHandler(pubsubName, topic, route.default);
        }

        // Register the other routes
        if (route.rule) {
            for (const rule of route.rule) {
                this.registerPubsubSubscriptionEventHandler(pubsubName, topic, rule.path);
            }
        }
    }

    generatePubsubSubscriptionEventHandlerKey(pubsubName: string, topic: string, route?: string): string {
        // Prefer this over method call as "" is not empty in route: string = "something"
        // so if we pass "" it breaks
        if (!route) {
            route = "default";
        }

        if (route.startsWith('/')) {
            route = route.replace('/', ''); // will only remove first occurence
        }

        return `${pubsubName.toLowerCase()}-${topic.toLowerCase()}-${route}`;
    }

    registerPubsubSubscriptionEventHandler(pubsubName: string, topic: string, route: string): void {
        const routeEventHandlerKey = this.generatePubsubSubscriptionEventHandlerKey(pubsubName, topic, route);

        this.logger.info(`Registering Event Handler: ${routeEventHandlerKey}`)

        // Already set, nothing to do
        if (this.pubsubSubscriptionEventHandlers[routeEventHandlerKey]) {
            return;
        }

        // Set the event handlers listeners (default none)
        this.pubsubSubscriptionEventHandlers[routeEventHandlerKey] = [];

        // Add a server POST handler
        this.server.post(`/${routeEventHandlerKey}`, async (req, res) => {
            // @ts-ignore
            // Parse the data of the body, we prioritize fetching the data key in body if possible
            // i.e. Redis returns { data: {} } and other services return {}
            // @todo: This will be deprecated in an upcoming major version and only req.body will be returned
            const data = req?.body?.data || req?.body;

            console.log("GOT DATA: " + routeEventHandlerKey);
            console.log(data);
            console.log(this.pubsubSubscriptionEventHandlers[routeEventHandlerKey])

            // Process our callback
            try {
                await Promise.all(this.pubsubSubscriptionEventHandlers[routeEventHandlerKey].map(cb => cb(data)));
            } catch (e) {
                this.logger.error(`[route-${routeEventHandlerKey}] Message processing failed, dropping: ${e}`);
                return res.send({ status: SubscribedMessageHttpResponse.DROP });
            }

            // Let Dapr know that the message was processed correctly
            this.logger.debug(`[route-${routeEventHandlerKey}] Ack'ing the message`);
            return res.send({ status: SubscribedMessageHttpResponse.SUCCESS });
        });
    }



    //     const subscribtionEventHandlerKey = this.createPubsubSubscriptionEventHandlerKey(pubSubName, topicName, options);
    //     // this.handlersTopics[handlerKey].cb = cb;
    //     // this.handlersTopics[handlerKey].options = options;

    //     // Make sure we defined a route, else pick one
    //     if(!route) {
    //         route = `route-${pubsubName}-${topic}`;
    //     }

    //         // Register the handler
    //         await this.server.getServerImpl().registerPubSubSubscriptionRoute(pubsubName, topic, {
    //         route
    //     });

    // this.server.getServer().post(`/${route}`, async (req, res) => {
    //     // @ts-ignore
    //     // Parse the data of the body, we prioritize fetching the data key in body if possible
    //     // i.e. Redis returns { data: {} } and other services return {}
    //     // @todo: This will be deprecated in an upcoming major version and only req.body will be returned
    //     const data = req?.body?.data || req?.body;

    //     // Process our callback
    //     try {
    //         await cb(data);
    //     } catch (e) {
    //         this.logger.error(`[route-${topic}] Message processing failed, dropping: ${e}`);
    //         return res.send({ status: SubscribedMessageHttpResponse.DROP });
    //     }

    //     // Let Dapr know that the message was processed correctly
    //     this.logger.debug(`[route-${topic}] Ack'ing the message`);
    //     return res.send({ status: SubscribedMessageHttpResponse.SUCCESS });
    // });
    //     }

    // registerPubSubSubscriptionRoute(pubsubName: string, topicName: string, options: PubSubSubscriptionOptionsType): void {
    //     // this.pubSubSubscriptionPaths.push(options.routes.map(i => ));
    //     this.pubSubSubscriptionRoutes.push(options);

    // [
    //     {
    //       'pubsubname': 'pubsub',
    //       'topic': 'inventory',
    //       'routes': {
    //         'rules': [
    //           {
    //             'match': 'event.type == "widget"',
    //             'path': '/widgets'
    //           },
    //           {
    //             'match': 'event.type == "gadget"',
    //             'path': '/gadgets'
    //           },
    //         ],
    //         'default': '/products'
    //       }
    //     }]
    // }

    // _addPubSubSubscriptionPaths(options: PubSubSubscriptionOptionsType): void {
    //     if(options.routes) {

    // } else if (!options.routes && options.route && typeof options.route !== "string") {

    // } else if (!options.routes && options.route && typeof options.route === "string") {

    // } else {

    // }
    //     }
}