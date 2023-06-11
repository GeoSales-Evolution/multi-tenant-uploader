#!/bin/bash

HOST="localhost"
PORT=27017
DATABASE="multi_tenant_uploader"
COLLECTION=${2:-"tenant_driver"}
FILE_PATH=$1

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

mongosh "$HOST:$PORT/$DATABASE" --eval "db.$COLLECTION.insertOne($DOCUMENT);"