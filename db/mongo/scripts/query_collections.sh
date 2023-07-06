#!bin/bash

CONTAINER_NAME=${1:-mongo_db_4_uploader}
DB=${2:-multi_tenant_uploader}
CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $CONTAINER_NAME)
USER_NAME=myUserAdmin
PASSWORD=tupperware

# query tenant_driver
mongosh "mongodb://$USER_NAME:$PASSWORD@$CONTAINER_IP:27017/$DB?authSource=admin" --eval "db.tenant_driver.find()"

# query arquivo
mongosh "mongodb://$USER_NAME:$PASSWORD@$CONTAINER_IP:27017/$DB?authSource=admin"  --eval "db.arquivo.find()"
