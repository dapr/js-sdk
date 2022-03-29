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

import { AbstractActor } from "@dapr/dapr";
import ParkingSensorInterface from "./ParkingSensorInterface";

// Coordinates pool to pick from as center of the radius circle
// we take multiple so we can distribute points more
import COORDINATES from "./coordinates/parking-garage-microsoft.json";

const STATE_NAME_PARKING_SENSOR_VALUE = "parking-sensor-value";
const STATE_NAME_PARKING_SENSOR_LOCATION_LAT = "parking-sensor-location-lat";
const STATE_NAME_PARKING_SENSOR_LOCATION_LNG = "parking-sensor-location-lng";

export default class ParkingSensorImpl extends AbstractActor implements ParkingSensorInterface {
  async carEnter(): Promise<void> {
    await this.getStateManager().setState(STATE_NAME_PARKING_SENSOR_VALUE, true);

    const sensorLocationLat = await this.getStateManager().getState(STATE_NAME_PARKING_SENSOR_LOCATION_LAT);
    const sensorLocationLng = await this.getStateManager().getState(STATE_NAME_PARKING_SENSOR_LOCATION_LNG);

    await this.getDaprClient().binding.send("binding-influxdb", "create", {
      measurement: "sensor-states",
      tags: `sensor=${this.getId().getId()}`,
      values: `lat=${sensorLocationLat},lng=${sensorLocationLng},isParked=1`
    });
  }

  async carLeave(): Promise<void> {
    await this.getStateManager().setState(STATE_NAME_PARKING_SENSOR_VALUE, true);

    const sensorLocationLat = await this.getStateManager().getState(STATE_NAME_PARKING_SENSOR_LOCATION_LAT);
    const sensorLocationLng = await this.getStateManager().getState(STATE_NAME_PARKING_SENSOR_LOCATION_LNG);

    await this.getDaprClient().binding.send("binding-influxdb", "create", {
      measurement: "sensor-states",
      tags: `sensor=${this.getId().getId()}`,
      values: `lat=${sensorLocationLat},lng=${sensorLocationLng},isParked=0`
    });
  }

  async getInfo(): Promise<object> {
    const sensorValue = await this.getStateManager().getState(STATE_NAME_PARKING_SENSOR_VALUE);
    const sensorLocationLat = await this.getStateManager().getState(STATE_NAME_PARKING_SENSOR_LOCATION_LAT);
    const sensorLocationLng = await this.getStateManager().getState(STATE_NAME_PARKING_SENSOR_LOCATION_LNG);

    return {
      sensorValue,
      sensorLocationLat,
      sensorLocationLng
    }
  }

  async onActivate(): Promise<void> {
    const coordIdx = Math.floor(Math.random() * COORDINATES.length);
    const lat = COORDINATES[coordIdx]["lat"];
    const lng = COORDINATES[coordIdx]["lng"];
    const spotLocation = this.generateRandomPoint({ lat, lng }, 20);

    await this.getStateManager().setState(STATE_NAME_PARKING_SENSOR_VALUE, false);
    await this.getStateManager().setState(STATE_NAME_PARKING_SENSOR_LOCATION_LAT, spotLocation.lat);
    await this.getStateManager().setState(STATE_NAME_PARKING_SENSOR_LOCATION_LNG, spotLocation.lng);
  }

  generateRandomPoint(center: { lat: number, lng: number }, radius: number) {
    const x0 = center.lng;
    const y0 = center.lat;

    // Convert Radius from meters to degrees.
    const rd = radius / 111300;

    const u = Math.random();
    const v = Math.random();

    const w = rd * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);

    const xp = x / Math.cos(y0);

    // Resulting point.
    return { 'lat': y + y0, 'lng': xp + x0 };
  }
}