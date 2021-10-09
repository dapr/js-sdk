# Examples - Hello World

## TODO

```bash
# Run InfluxDB
# Note: it auto removes after shutdown
# Note: non-persistent volume, add "-v influxdb2:/var/lib/influxdb2" to make it persistent
docker run --rm -it -d \
    -e DOCKER_INFLUXDB_INIT_MODE=setup \
    -e DOCKER_INFLUXDB_INIT_USERNAME=admin \
    -e DOCKER_INFLUXDB_INIT_PASSWORD=MyAdmin@123! \
    -e DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=my-token \
    -e DOCKER_INFLUXDB_INIT_ORG=my-parking-garage \
    -e DOCKER_INFLUXDB_INIT_BUCKET=my-sensors \
    --net=host \
    --name influxdb \
    influxdb:2.0

# Run Telegraf
docker run --rm -it -d \
    --net=host \
    --name=telegraf \
    telegraf

# Run Grafana
# Note: non-persistent volume, add "-v influxdb2:/var/lib/influxdb2" to make it persistent
docker run --rm -it -d \
    --name=grafana \
    --net=host \
    grafana/grafana
```

## Running

```bash
# Build the Source (from the root)
./build.sh

# Install (from the example directory)
npm install

# Start a RabbitMQ Container (for the binding example part)
# note: mgmt interface at http://localhost:15672 
docker run -d --rm --hostname my-rabbitmq --name my-rabbitmq \
    -e RABBITMQ_DEFAULT_USER=test-user -e RABBITMQ_DEFAULT_PASS=test-password \
    -p 0.0.0.0:5672:5672 -p 0.0.0.0:15672:15672 \
    rabbitmq:3-management

# Run the example
npm run start:dapr
```

```
from(bucket: "my-sensors")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "sensor-states")
  |> pivot(columnKey: ["_field"], rowKey: ["_time"], valueColumn: "_value")
  |> group()
  |> yield(name: "last")
```