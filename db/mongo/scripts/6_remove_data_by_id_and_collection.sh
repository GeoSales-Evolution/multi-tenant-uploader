#!/bin/bash

HOST="localhost"
PORT=27017
DATABASE="multi_tenant_uploader"
COLLECTION=${2:-"tenant_driver"}

ENTRY_ID=$1

# Needs mongosh install in the machine
mongosh "$HOST:$PORT/$DATABASE" --eval "db.$COLLECTION.deleteOne({ _id: ObjectId('$ENTRY_ID') })"

