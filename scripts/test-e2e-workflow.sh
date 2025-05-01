#!/bin/bash
# Start the sidecar if it is not running yet
if [ ! "$(docker ps -q -f name=durabletask-sidecar)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=durabletask-sidecar)" ]; then
        # cleanup
        docker rm durabletask-sidecar
    fi

    # run your container
    echo "Starting Sidecar"
    docker run \
        --name durabletask-sidecar -d --rm \
        -p 4001:4001 \
        --env 'DURABLETASK_SIDECAR_LOGLEVEL=Debug' \
        cgillum/durabletask-sidecar:latest start \
        --backend Emulator
fi

echo "Running workflow E2E tests"
npm run test:e2e:workflow:internal

# It should fail if the npm run fails
if [ $? -ne 0 ]; then
    echo "E2E tests failed"
    exit 1
fi

echo "Stopping Sidecar"
docker stop durabletask-sidecar