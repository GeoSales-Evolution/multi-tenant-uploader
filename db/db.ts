import { MongoClient, Db } from 'mongodb'
import { config as dotenvConfig } from "dotenv-safe"
import TenantConfig from "../types.js"

dotenvConfig()

const dbServer: string | undefined = process.env.DB_SERVER
const dbUser: string | undefined = process.env.DB_USER
const dbPassword: string | undefined = process.env.DB_PASSWORD
const dbName: string | undefined = process.env.DB_NAME

const urlConnection: string = `${dbServer}://${dbUser}:${dbPassword}@presente.s2xbxel.mongodb.net/`
const client: MongoClient = new MongoClient(urlConnection)

try {
    await client.connect()
    console.log('Connected successfully to Mongo Database')
} catch (error: any) {
    throw error
}

async function getTenantConfig(tenant: string): Promise<any> {
    const db: Db = client.db(dbName)
    const tenantConfig = await db.collection('tenants_drivers')
        .findOne({tenant: `${tenant}`})
    return tenantConfig
}

async function updateAccessToken(tenant: string, newToken: string) {
    const db: Db = client.db(dbName)
    db.collection('tenants_drivers').updateOne(
        { tenant: `${tenant}` },
        {
          $set: { "properties.access_token": `${newToken}` },
        }
     )
}

export { getTenantConfig, updateAccessToken }
