#!bin/bash

IMAGE_NAME=${1:-mongo_db_4_uploader}

docker build -t $IMAGE_NAME .
