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
import { DaprPubSubType } from "../../../types/pubsub/DaprPubSub.type";
import { DaprPubSubRouteType } from "../../../types/pubsub/DaprPubSubRouteType.type";
import { DaprPubSubRuleType } from "../../../types/pubsub/DaprPubSubRuleType.type";
import { PubSubSubscriptionOptionsType } from "../../../types/pubsub/PubSubSubscriptionOptions.type";
import { IServerType } from "./HTTPServer";

export default class HTTPServerImpl {
    private readonly server: IServerType;
    private readonly logger: Logger;

    pubsubSubscriptions: DaprPubSubType[];
    pubsubRouteEventHandlers: { [key: string]: TypeDaprPubSubCallback[] };

    constructor(server: IServerType, loggerOptions?: LoggerOptions) {
        this.server = server;
        this.logger = new Logger("HTTPServer", "HTTPServerImpl", loggerOptions);

        this.pubsubSubscriptions = []
        this.pubsubRouteEventHandlers = {};
    }

    /**
     * When we subscribe, we subscribe to a topic
     * For this topic we can define "routes" which route to a certain callback depending on the event content
     * Each of these topics are handled by a EventHandler but there can be multiple handlers per pubsubname-topic-route combination
     * 
     * We don't create the EventHandlers here but we ensure that the routes are registered and can receive POST events
     * -> we create POST /<route> endpoints for each, but we create them uniquely!
     * -> to ensure uniqueness, we just check if this.pubsubRouteEventHandlers[route] is set
     * 
     * @param pubSubName 
     * @param topicName 
     * @param cb 
     * @param options 
     */
    registerPubsubSubscription(pubsubName: string, topic: string, options: PubSubSubscriptionOptionsType = {}): void {
        if (this.pubsubSubscriptions.filter(i => i.topic === topic).length > 0) {
            throw new Error(`The topic '${topic}' is already being subscribed to on PubSub '${pubsubName}', there can only be one topic registered.`);
        }

        // Create event handlers for the different routes
        // If we provide a routes array, multiple routes should be added based on rules and a default
        if (options.route) {
            // options.route == string
            if (typeof options.route === "string") {
                this.registerPubsubRouteEventHandler(pubsubName, topic, options.route);
            }
            // options.route == DaprPubSubRouteType
            else if (typeof options.route === "object" && !Array.isArray(options.route)) {
                this.registerPubsubRoute(pubsubName, topic, options.route);
            }
            // options.route == DaprPubSubRouteType[]
            else if (typeof options.route === "object" && Array.isArray(options.route)) {
                for (const route of options.route) {
                    this.registerPubsubRoute(pubsubName, topic, route)
                }
            }
            // Default handler
            // options.route == unknown 
            else {
                this.registerPubsubRouteEventHandler(pubsubName, topic, "default");
            }
        }
        // Default handler
        // options.route == undefined 
        else {
            this.registerPubsubRouteEventHandler(pubsubName, topic, "default");
        }

        // Register the subscription, we will return this in the /dapr/subscribe endpoint
        this.pubsubSubscriptions.push(this.generatePubSubSubscription(pubsubName, topic, options));
    }

    registerPubsubRoute(pubsubName: string, topic: string, route: DaprPubSubRouteType): void {
        // Register the default route if required
        if (route.default) {
            this.registerPubsubRouteEventHandler(pubsubName, topic, route.default);
        }

        // Register the other routes
        if (route.rules) {
            for (const rule of route.rules) {
                this.registerPubsubRouteEventHandler(pubsubName, topic, rule.path);
            }
        }
    }


    /**
     * Generate a subscription object that will be used in the /dapr/subscribe endpoint
     * this will let dapr know that we have subscriptions and how they map to routes / deadletter
     * 
     * Important: we internally translate the provided /example to -> /<pubsubname>-<topic>-example 
     *            or if empty to /<pubsubname>-<topic>-default
     *            this is to ensure that HTTP Server endpoints are unique
     * 
     * @param pubsubName 
     * @param topic 
     * @param options 
     * @returns 
     */
    generatePubSubSubscription(pubsubName: string, topic: string, options: PubSubSubscriptionOptionsType = {}): DaprPubSubType {
        if (!options || !options?.route) {
            return {
                pubsubname: pubsubName,
                topic: topic,
                metadata: options.metadata,
                route: `/${this.generatePubsubRouteEventHandlerKey(pubsubName, topic)}`, // it's a string
                deadLetterTopic: options.deadLetterTopic
            }
        } else if (typeof options.route === "string") {
            return {
                pubsubname: pubsubName,
                topic: topic,
                metadata: options.metadata,
                route: `/${this.generatePubsubRouteEventHandlerKey(pubsubName, topic, options.route)}`, // it's a string
                deadLetterTopic: options.deadLetterTopic
            }
        } else {
            return {
                pubsubname: pubsubName,
                topic: topic,
                metadata: options.metadata,
                routes: options.route && {
                    default: `${options.route?.default}`,
                    rules: options.route?.rules?.map(rule => ({
                        match: rule.match,
                        path: `/${this.generatePubsubRouteEventHandlerKey(pubsubName, topic, rule.path)}`
                    }))
                },
                deadLetterTopic: options.deadLetterTopic
            }
        }
    }

    /**
     * We generate a event handler key based on the path or the route 
     * If the route is just a string, that is the path
     * Else the path is configured through a rule of DaprPubSubRuleType
     * 
     * @param pubsubName 
     * @param topic 
     * @param route 
     * @returns 
     */
    generatePubsubRouteEventHandlerKey(pubsubName: string, topic: string, route?: string | DaprPubSubRuleType): string {

        let routeParsed = "";

        // First parse the route based on if it was a Rule or a String
        if (!route) {
            routeParsed = "default";
        } else {
            if (typeof route === "object") {
                routeParsed = route?.path || "";
            } else {
                routeParsed = route;
            }
        }

        // Then, process it
        // Remove leading slashes
        if (routeParsed.startsWith('/')) {
            routeParsed = routeParsed.replace('/', ''); // will only remove first occurence
        }

        return `${pubsubName.toLowerCase()}--${topic.toLowerCase()}--${routeParsed}`;
    }

    registerPubsubRouteEventHandler(pubsubName: string, topic: string, route: string): void {
        const routeEventHandlerKey = this.generatePubsubRouteEventHandlerKey(pubsubName, topic, route);

        this.logger.info(`Registering Event Handler: ${routeEventHandlerKey}`)

        // Already set, nothing to do
        if (this.pubsubRouteEventHandlers[routeEventHandlerKey]?.length > 0) {
            return;
        }

        // Set the event handlers listeners (default none)
        this.pubsubRouteEventHandlers[routeEventHandlerKey] = [];

        // Add a server POST handler
        this.server.post(`/${routeEventHandlerKey}`, async (req, res) => {
            // @ts-ignore
            // Parse the data of the body, we prioritize fetching the data key in body if possible
            // i.e. Redis returns { data: {} } and other services return {}
            // @todo: This will be deprecated in an upcoming major version and only req.body will be returned
            const data = req?.body?.data || req?.body;

            // Process our callback
            try {
                await Promise.all(this.pubsubRouteEventHandlers[routeEventHandlerKey].map(cb => cb(data)));
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
    //         await this.server.getServerImpl().registerPubsubRoute(pubsubName, topic, {
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

    // registerPubsubRoute(pubsubName: string, topicName: string, options: PubSubSubscriptionOptionsType): void {
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