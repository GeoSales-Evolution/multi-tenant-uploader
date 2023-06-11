#!bin/bash

FLAG_NAMMING_CONTAINER=${1:-mongo_db_4_uploader}
BASE_IMAGE_NAME=${2:-mongo_db_4_uploader}

docker run -d -p 27017:27017 --name $FLAG_NAMMING_CONTAINER $BASE_IMAGE_NAME
