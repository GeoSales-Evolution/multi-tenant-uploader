#!bin/bash

CONTAINER_NAME=${1:-mongo_db_4_uploader}
INTERNAL_DB_NAME=${2:-multi_tenant_uploader}

# query tenant_driver
docker exec $CONTAINER_NAME mongosh $INTERNAL_DB_NAME --eval "db.tenant_driver.find()"

# query arquivo
docker exec $CONTAINER_NAME mongosh $INTERNAL_DB_NAME --eval "db.arquivo.find()"
