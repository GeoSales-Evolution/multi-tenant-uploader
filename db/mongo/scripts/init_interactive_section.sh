#!bin/bash

CONTAINER_NAME=${1:-mongo_db_4_uploader}
USER_NAME=myUserAdmin
PASSWORD=tupperware
CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $CONTAINER_NAME)
DB=multi_tenant_uploader

mongosh "mongodb://$USER_NAME:$PASSWORD@$CONTAINER_IP:27017/$DB?authSource=admin"