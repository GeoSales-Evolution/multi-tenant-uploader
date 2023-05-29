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

async function updateOneDriveTokens() {
    console.log("\nRefreshing all One Drive's tokens...\n")
    const db: Db = client.db(dbName)

    const tenantsConfig = await db.collection('tenants_drivers')
        .find({driver: "oneDrive"}, {projection: {tenant: 1, properties: 1}})

    for await (const tenantProps of tenantsConfig) {
        console.log(`Generating a new token to ${tenantProps.tenant}. Please wait...`)

        const tokenResponse = await fetch(`${tenantProps.properties.token_url}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    'client_id': `${tenantProps.properties.client_id}`,
                    'client_secret': `${tenantProps.properties.client_secret}`,
                    'grant_type': `${tenantProps.properties.grant_type}`,
                    'scope': `${tenantProps.properties.scope}`,
                })
            }
        )

        if (tokenResponse.status == 200) {
            const tokenJsonResponse = await tokenResponse.json()
            await updateAccessToken(tenantProps.tenant, tokenJsonResponse.access_token)
            console.log(`${tenantProps.tenant} access_token refreshed successfully!`)
        } else {
            console.log(`WARNING: ${tenantProps.tenant} access_token couldn't be refreshed!`)
        }
    }
}

updateOneDriveTokens()
setInterval(updateOneDriveTokens, 3599 * 1000)

export { getTenantConfig, updateAccessToken }
