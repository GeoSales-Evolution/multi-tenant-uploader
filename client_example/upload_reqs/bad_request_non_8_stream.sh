#!/bin/bash
export LC_ALL=C.UTF-8 #prevents grep error

source ./../auth_vars
url=localhost:3003/upload

filePath=$1
filename=$(echo "$filePath" | grep -oP "(?<=/)[^/]+$")


# line removed -H "Content-Type: application/octet-stream" \
response=$(curl -X POST \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Disposition: attachment; filename=\"${filename}\"" \
    -H "driver: ${driver}" \
    --data-binary "@${filePath}" \
    ${url}/${tenant}
)

echo $response
