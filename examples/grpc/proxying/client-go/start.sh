#!/bin/bash
echo "Setting GO111MODULE to Auto"
go env -w GO111MODULE=auto

echo "Init if required"
go mod init client
go mod tidy

echo "Installing Dependencies"
go install google.golang.org/grpc@latest

dapr run --app-id client --app-protocol grpc --dapr-grpc-port 50007 -- go run main.go