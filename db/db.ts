import { MongoClient, Db } from 'mongodb'
import { config as dotenvConfig } from "dotenv-safe"

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

async function getTenantConfig(tenant: string, driver: string): Promise<TenantConfig | null> {
    const db: Db = client.db(dbName)
    const tenantDoc = await db.collection('tenant_driver')
        .findOne(
            {tenant: `${tenant}`},
            {projection: {
                    tenant: 1,
                    drivers: {$elemMatch: {"type": `${driver}`}}
            }})

    if (!tenantDoc) {
        return null
    }

    return tenantDoc.drivers ? {
        tenant: tenantDoc.tenant,
        driver: tenantDoc.drivers[0].type,
        properties: tenantDoc.drivers[0].properties
    } : {
        tenant: tenantDoc.tenant,
        driver: null,
        properties: null
    }
}

async function updateTokenCreationDate(tenant:string, newDate: string): Promise<void> {
    const db: Db = client.db(dbName)

    db.collection('tenant_driver').updateOne(
        { tenant: `${tenant}` },
        {$set: { "drivers.$[i].properties.token_creation_date": `${newDate}` }},
        {arrayFilters: [{"i.type": "one_drive"}]}
     )
}

async function updateAccessToken(tenant: string, newToken: string): Promise<void> {
    const db: Db = client.db(dbName)

    db.collection('tenant_driver').updateOne(
        { tenant: `${tenant}` },
        {$set: { "drivers.$[i].properties.access_token": `${newToken}` }},
        {arrayFilters: [{"i.type": "one_drive"}]}
     )
}

export { getTenantConfig, updateAccessToken, updateTokenCreationDate }
