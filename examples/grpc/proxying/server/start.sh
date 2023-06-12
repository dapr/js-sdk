#!/bin/bash
echo "Setting GO111MODULE to Auto"
go env -w GO111MODULE=auto

echo "Init if required"
go mod init server
go mod tidy

echo "Installing Dependencies"
go install google.golang.org/grpc@latest

dapr run --app-id server --app-protocol grpc --app-port 50051 -- go run main.go