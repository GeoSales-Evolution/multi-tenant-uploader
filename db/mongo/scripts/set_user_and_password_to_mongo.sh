#!/bin/bash

DB_USER=$1
DB_PASSWORD=$2

mongosh admin -u $1 -p $2 --eval '
  db.createUser(
    {
      user: "uploader",
      pwd: passwordPrompt(), // or cleartext password
      roles: [
        { role: "userAdminAnyDatabase", db: "multi_tenant_uploader" },
        { role: "readWriteAnyDatabase", db: "multi_tenant_uploader" }
      ]
    }
  )
'