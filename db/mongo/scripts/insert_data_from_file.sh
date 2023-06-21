#!/bin/bash

HOST="localhost"
PORT=27017
DATABASE="multi_tenant_uploader"

FILE_PATH=$1
USER=$2
PASSWORD=$3
COLLECTION=${4:-"tenant_driver"}
AUTH_SOURCE=${5:-"admin"}


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

mongosh $AUTH_SOURCE -u $USER -p $PASSWORD "$HOST:$PORT/$DATABASE" --eval "db.$COLLECTION.insertOne($DOCUMENT);"