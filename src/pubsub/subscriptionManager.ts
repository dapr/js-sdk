/*
Copyright 2023 The Dapr Authors
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

import { TypeDaprPubSubCallback } from "../types/DaprPubSubCallback.type";
import { KeyValueType } from "../types/KeyValue.type";
import { DaprPubSubType } from "../types/pubsub/DaprPubSub.type";
import { PubSubSubscriptionOptionsType } from "../types/pubsub/PubSubSubscriptionOptions.type";
import { PubSubSubscriptionTopicType } from "../types/pubsub/PubSubSubscriptionTopic.type";
import { PubSubSubscriptionTopicRoutesType } from "../types/pubsub/PubSubSubscriptionTopicRoutes.type";
import { PubSubSubscriptionsType } from "../types/pubsub/PubSubSubscriptions.type";
import { Settings } from "../utils/Settings.util";

/**
 * SubscriptionManager manages server-side storage and lookup of subscriptions.
 */
export class SubscriptionManager {
  private readonly subscriptions: PubSubSubscriptionsType = {};

  /**
   * Check if pubsub is registered.
   * @param pubsub name of the pubsub component
   * @returns true if the pubsub is registered
   */
  public isPubSubRegistered(pubsub: string): boolean {
    return this.subscriptions[pubsub] !== undefined;
  }

  /**
   * Check if pubsub and topic are registered.
   * @param pubsub name of the pubsub component
   * @param topic name of the topic
   * @returns true if the pubsub and topic are registered
   */
  public isTopicRegistered(pubsub: string, topic: string): boolean {
    return this.subscriptions[pubsub]?.[topic] !== undefined;
  }

  /**
   * Get the subscription for a given pubsub and topic.
   * @param pubsub name of the pubsub component
   * @param topic name of the topic
   * @returns the subscription for the given pubsub and topic
   */
  public getSubscription(pubsub: string, topic: string): PubSubSubscriptionTopicType {
    return this.subscriptions[pubsub]?.[topic];
  }

  /**
   * Get all registered pubsubs.
   * @returns all registered pubsubs
   */
  public getRegisteredPubSubs(): string[] {
    return Object.keys(this.subscriptions);
  }

  /**
   * Get all registered topics for a given pubsub.
   * @param pubsub name of the pubsub component
   * @returns all registered topics for the given pubsub
   */
  public getRegisteredTopics(pubsub: string): string[] {
    return Object.keys(this.subscriptions[pubsub] ?? {});
  }

  /**
   * Register a new subscription for a given pubsub and topic.
   * @param pubsub name of the pubsub component
   * @param topic name of the topic
   */
  public registerSubscription(pubsub: string, topic: string, options: PubSubSubscriptionOptionsType = {}): void {
    if (this.isTopicRegistered(pubsub, topic)) {
      throw new Error(
        `The topic '${topic}' is already subscribed to PubSub '${pubsub}',` +
          ` there can be only one topic registered.`,
      );
    }

    if (!this.subscriptions[pubsub]) {
      this.subscriptions[pubsub] = {};
    }

    const topicData: PubSubSubscriptionTopicType = {
      routes: this.generateRoutes(pubsub, topic, options),
      dapr: this.generateDaprSubscription(pubsub, topic, options),
    };

    this.subscriptions[pubsub][topic] = topicData;
  }

  /**
   * Add an event handler to an existing subscription.
   * @param pubsub name of the pubsub component
   * @param topic name of the topic
   * @param route name of the route
   * @param handler callback to be called when an event is received
   */
  public addEventHandlerToSubscription(
    pubsub: string,
    topic: string,
    handler: TypeDaprPubSubCallback,
    route?: string,
  ): void {
    const routeName = this.getSanitizedRouteWithDefault(route);
    const subscription = this.getSubscription(pubsub, topic);
    if (!subscription) {
      throw new Error(`The topic '${topic}' is not subscribed to PubSub '${pubsub}',` + ` cannot add event handler.`);
    }

    if (!subscription.routes[routeName]) {
      throw new Error(
        `The route '${routeName}' is not registered for topic '${topic}' and PubSub '${pubsub}',` +
          ` cannot add event handler.`,
      );
    }
    subscription.routes[routeName].eventHandlers.push(handler);
  }

  /**
   * Lookup the topic and route for a given pubsub, topic (with wilcard support) and path.
   * If not found, topic is empty.
   * @param pubsub name of the pubsub component
   * @param topic name of the topic
   * @param path path from the event
   * @returns the topic and route
   */
  public lookupTopicWilcard(pubsub: string, topic: string, path: string): [string, string] {
    if (!this.isPubSubRegistered(pubsub)) {
      return ["", ""];
    }

    const matchingTopic = this.getMatchingTopic(pubsub, topic);
    if (matchingTopic == "") {
      return ["", ""];
    }

    const route = this.getSanitizedRouteWithDefault(this.getRouteFromPath(pubsub, matchingTopic, path));

    return [matchingTopic, route];
  }

  /**
   * Get all subscriptions, used for testing.
   * @returns all subscriptions.
   */
  public getSubscriptions(): PubSubSubscriptionsType {
    return this.subscriptions;
  }

  /**
   * Get the route part from the path.
   * @param pubsub name of the pubsub component
   * @param topic name of the topic
   * @param path path from the event
   * @returns the route
   */
  private getRouteFromPath(pubsub: string, topic: string, path: string): string {
    // Path is of format: {pubsub}--{topic}--{route}
    // It should also not contain any slashes for compatibility with HTTP paths.
    return path
      .replace(`${pubsub.toLowerCase()}--${this.sanitizeHttpPath(topic).toLowerCase()}--`, "")
      .replace("/", "");
  }

  /**
   * Sanitize the HTTP path.
   * Replaces special characters with dashes.
   * @param path path to sanitize
   */
  private sanitizeHttpPath(path: string): string {
    return path.replace(/[^a-zA-Z0-9-]/g, "-");
  }

  /**
   * getMatchingTopic returns the topic that matches the provided topic.
   * If no topic matches, an empty string is returned.
   * Note that the pubsub might be subscribed to wildcard topics with identifiers like `#` or `+`.
   * @param pubsub name of the pubsub component
   * @param topic name of the topic
   */
  private getMatchingTopic(pubsub: string, topic: string): string {
    const pubSubSubscriptions = this.subscriptions[pubsub];
    if (!pubSubSubscriptions) {
      return "";
    }

    // If the topic is directly subscribed to, return it.
    if (pubSubSubscriptions[topic]) {
      return topic;
    }

    // Else find if the topic is subscribed to with a wildcard.
    // We iterate over the topics and check if the topic matches the wildcard.
    // For #, example topic is `a/b/c` and subscription topic is `a/#`.
    // For +, example topic is `a/b/c` and subscription topic is `a/+/c`.
    for (const subscribedTopic of Object.keys(pubSubSubscriptions)) {
      if (subscribedTopic.includes("#") || subscribedTopic.includes("+")) {
        const topicRegex = new RegExp(subscribedTopic.replace(/[#]/g, ".*").replace(/[+]/g, "[^/]*"));
        if (topicRegex.test(topic)) {
          return subscribedTopic;
        }
      }
    }

    return "";
  }

  /**
   * Get the sanitized route with the default route if not specified.
   * @param route optional route
   * @param defaultRoute default route if not specified
   * @returns the sanitized route
   */
  private getSanitizedRouteWithDefault(
    route?: string,
    defaultRoute: string = Settings.getDefaultPubSubRouteName(),
  ): string {
    return (route || defaultRoute).replace("/", "");
  }

  /**
   * Generate the path for a given pubsub, topic and route.
   * @param pubsub name of the pubsub component
   * @param topic name of the topic
   * @param route optional route if explicitly specified in the subscription
   */
  private generatePubSubPath(pubsub: string, topic: string, route?: string): string {
    const routeName = this.getSanitizedRouteWithDefault(route);
    return `${pubsub.toLowerCase()}--${this.sanitizeHttpPath(topic).toLowerCase()}--${routeName}`;
  }

  /**
   * Generate routes for a given topic in a pubsub using the subscription options.
   * @param pubsub name of the pubsub component
   * @param topic name of the topic
   * @param options subscription options
   */
  private generateRoutes(
    pubsub: string,
    topic: string,
    options: PubSubSubscriptionOptionsType = {},
  ): PubSubSubscriptionTopicRoutesType {
    const routes: PubSubSubscriptionTopicRoutesType = {};

    // options.route is typeof DaprPubSubRouteType
    if (typeof options.route === "object") {
      // Register the default
      if (options.route.default) {
        const routeName = this.getSanitizedRouteWithDefault(options.route.default);
        routes[routeName] = {
          eventHandlers: [],
          path: this.generatePubSubPath(pubsub, topic, routeName),
        };
      }

      // Add rules
      if (options.route.rules) {
        for (const rule of options.route.rules) {
          // If the route is not already registered, register it.
          if (!routes[rule.path]) {
            const routeName = this.getSanitizedRouteWithDefault(rule.path);
            routes[routeName] = {
              eventHandlers: [],
              path: this.generatePubSubPath(pubsub, topic, routeName),
            };
          }
        }
      }
    }
    // options.route is typeof string or undefined
    else {
      const routeName = this.getSanitizedRouteWithDefault(options.route);
      routes[routeName] = {
        eventHandlers: [],
        path: this.generatePubSubPath(pubsub, topic, routeName),
      };
    }

    // Deadletter support
    if (options.deadLetterTopic || options.deadLetterCallback) {
      const routeName = this.getSanitizedRouteWithDefault(
        options.deadLetterTopic,
        Settings.getDefaultPubSubDeadLetterRouteName(),
      );

      // Initialize the route
      routes[routeName] = {
        eventHandlers: [],
        path: this.generatePubSubPath(pubsub, topic, routeName),
      };

      // Add a callback if we have one provided
      if (options.deadLetterCallback) {
        routes[routeName].eventHandlers.push(options.deadLetterCallback);
      }
    }

    return routes;
  }

  /**
   * Generate the subscription object queried by the Dapr sidecar on startup.
   * This is used to inform the Dapr sidecar of the subscriptions and how to route events.
   *
   * Important: we internally translate the provided /example to -> /<pubsubname>-<topic>-example
   *            or if empty to /<pubsubname>-<topic>-default
   *            this is to ensure that HTTP Server endpoints are unique.
   * @param pubsub name of the pubsub component
   * @param topic name of the topic
   * @param options subscription options
   */
  private generateDaprSubscription(
    pubsub: string,
    topic: string,
    options: PubSubSubscriptionOptionsType = {},
  ): DaprPubSubType {
    // Construct the metadata object
    let metadata: KeyValueType | undefined;
    if (options.metadata) {
      metadata = {};
      for (const [key, value] of Object.entries(options.metadata)) {
        metadata[key] = JSON.stringify(value);
      }
    }

    // options.route is typeof DaprPubSubRouteType
    if (typeof options.route === "object") {
      const routes = {
        default: `/${this.generatePubSubPath(pubsub, topic, options.route.default)}`,
        rules: options.route.rules?.map((rule) => ({
          match: rule.match,
          path: `/${this.generatePubSubPath(pubsub, topic, rule.path)}`,
        })),
      };
      return {
        pubsubname: pubsub,
        topic: topic,
        metadata: metadata,
        routes: routes,
        deadLetterTopic: options.deadLetterTopic,
        bulkSubscribe: options.bulkSubscribe,
      };
    }
    // options.route is typeof string or undefined
    else {
      return {
        pubsubname: pubsub,
        topic: topic,
        metadata: metadata,
        route: `/${this.generatePubSubPath(pubsub, topic, options.route)}`,
        deadLetterTopic: options.deadLetterTopic,
        bulkSubscribe: options.bulkSubscribe,
      };
    }
  }
}
