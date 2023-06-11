#!bin/bash

CONTAINER_NAME=${1:-mongo_db_4_uploader}

docker exec -it $CONTAINER_NAME mongosh
