#!/bin/bash

ENTRY_ID=$1
COLLECTION=${2:-"tenant_driver"}
CONTAINER_NAME=${3:-mongo_db_4_uploader}
DB=${4:-multi_tenant_uploader}
CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $CONTAINER_NAME)
USER_NAME=myUserAdmin
PASSWORD=tupperware

mongosh "mongodb://$USER_NAME:$PASSWORD@$CONTAINER_IP:27017/$DB?authSource=admin" --eval "db.$COLLECTION.deleteOne({ _id: ObjectId('$ENTRY_ID') })"