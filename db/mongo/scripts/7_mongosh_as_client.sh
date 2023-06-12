#!/bin/bash

HOST_IP=${1:-"localhost"}
PORT=27017
DATABASE=${2:-"multi_tenant_uploader"}

mongosh "$HOST_IP:$PORT/$DATABASE"