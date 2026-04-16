#!/usr/bin/env node
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

const { execSync } = require('child_process');

/**
 * Cross-platform test initialization script for Dapr JS SDK
 * Replaces test-init.sh with a Node.js implementation that works on all platforms
 * Starts Docker containers for MQTT, RabbitMQ, and MongoDB required for testing
 */

async function main() {
  try {
    console.log('=======================================================');
    console.log('============ Dapr JS SDK Test Initialization =========');
    console.log('=======================================================');
    console.log(`Executing in ${process.cwd()}`);
    console.log('Description: Starting test infrastructure (Docker containers)');
    console.log('=======================================================');

    // Check if Docker is running
    console.log('Checking Docker status...');
    try {
      execSync('docker stats --no-stream', { stdio: 'pipe' });
      console.log('Docker is running');
    } catch (error) {
      console.error('Docker is not running, please start it first');
      process.exit(1);
    }

    // Start MQTT Broker
    console.log('Starting MQTT Broker');
    console.log('Dashboard: http://localhost:18083 (user: admin, pass: public)');
    console.log('Ports: 1883 = TCP MQTT Port | 8081 = HTTP API | 8083 = MQTT/SSL Port | 8883 = MQTT/Websocket/SSL Port | 8084 = MQTT/Websocket Port | 18083 = Dashboard');

    execSync('docker run -d --rm --name emqx -p 1883:1883 -p 8081:8081 -p 8083:8083 -p 8883:8883 -p 8084:8084 -p 18083:18083 emqx/emqx', {
      stdio: 'inherit'
    });

    // Start RabbitMQ
    console.log('Starting Rabbit MQ');
    execSync('docker run -d --rm --hostname my-rabbitmq --name my-rabbitmq -p 0.0.0.0:5672:5672 -p 0.0.0.0:15672:15672 rabbitmq:3-management', {
      stdio: 'inherit'
    });

    // Start MongoDB
    console.log('Starting MongoDB');
    execSync('docker run -d --rm --name mongodb -p 27017:27017 mongo', {
      stdio: 'inherit'
    });

    console.log('=======================================================');
    console.log('Test infrastructure started successfully!');
    console.log('Services available:');
    console.log('- MQTT Broker: localhost:1883 (Dashboard: localhost:18083)');
    console.log('- RabbitMQ: localhost:5672 (Management: localhost:15672)');
    console.log('- MongoDB: localhost:27017');
    console.log('=======================================================');

  } catch (error) {
    console.error('Test initialization failed:', error.message);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { main };