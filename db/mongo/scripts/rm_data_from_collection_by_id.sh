#!/bin/bash

HOST="localhost"
PORT=27017
DATABASE="multi_tenant_uploader"

ENTRY_ID=$1
USER=$2
PASSWORD=$3
COLLECTION=${4:-"tenant_driver"}
AUTH_SOURCE=${5:-"admin"}

mongosh $AUTH_SOURCE -u $USER -p $PASSWORD "$HOST:$PORT/$DATABASE" --eval "db.$COLLECTION.deleteOne({ _id: ObjectId('$ENTRY_ID') })"