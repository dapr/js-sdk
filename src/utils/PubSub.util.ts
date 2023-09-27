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

import { Settings } from "./Settings.util";

/**
 * Get the route for a given topic and pubsub name.
 * @param pubsubName name of the pubsub component
 * @param topic name of the topic
 * @param routeFromSubcription optional route if explicitly specified in the subscription
 */
export function getPubSubRoute(pubsubName: string, topic: string, routeFromSubcription?: string): string {
  let routeParsed = "";
  if (routeFromSubcription) {
    routeParsed = routeFromSubcription;
  } else {
    routeParsed = Settings.getDefaultPubSubRouteName();
  }

  // Remove leading slash if present
  if (routeParsed.startsWith("/")) {
    routeParsed = routeParsed.substring(1);
  }

  const route = `${pubsubName.toLowerCase()}--${topic.toLowerCase()}--${routeParsed}`;
  return encodeURIComponent(route);
}
