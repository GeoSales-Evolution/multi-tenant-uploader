#!/bin/bash

DATABASE="multi_tenant_uploader"
MONGO_ENDPOINT='localhost:27017'

USER=$1
PASSWORD=$2
AUTH_SOURCE=${3:-"admin"}

mongosh $AUTH_SOURCE -u $USER -p $PASSWORD "$HOST:$PORT/$DATABASE" --eval "db.tenant_driver.find();"
mongosh $AUTH_SOURCE -u $USER -p $PASSWORD "$HOST:$PORT/$DATABASE" --eval "db.arquivo.find();"