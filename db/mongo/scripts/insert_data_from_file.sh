#!/bin/bash

FILE_PATH=$1
COLLECTION=${2:-"tenant_driver"}
CONTAINER_NAME=${3:-mongo_db_4_uploader}
CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $CONTAINER_NAME)
DB=${2:-multi_tenant_uploader}
USER_NAME=myUserAdmin
PASSWORD=tupperware

echo $CONTAINER_IP
if [ -z "$FILE_PATH" ]; then
  echo "Error: File argument is missing."
  echo "Usage: $0 collection_name file_path"
  exit 1
fi

if [ ! -f "$FILE_PATH" ]; then
  echo "Error: File '$FILE_PATH' does not exist."
  exit 1
fi

DOCUMENT=$(cat "$FILE_PATH")

mongosh "mongodb://$USER_NAME:$PASSWORD@$CONTAINER_IP:27017/$DB?authSource=admin" --eval "db.$COLLECTION.insertOne($DOCUMENT);"