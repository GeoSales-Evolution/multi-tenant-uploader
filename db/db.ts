import { MongoClient, Db } from 'mongodb'
import { config as dotenvConfig } from "dotenv-safe"

dotenvConfig()

const host: string = process.env.HOST_IP || 'localhost';
const port: number = parseInt(process.env.PORT || '27017');

const client: MongoClient = new MongoClient(`mongodb://${host}:${port}`);

const dbName: string | undefined = process.env.DB_NAME

try {
    await client.connect()
    console.log('Connected successfully to Mongo Database')
} catch (error: any) {
    throw error
}

async function getTenantConfig(tenant: string): Promise<any> {
    const db: Db = client.db(dbName)
    const tenantDoc = await db.collection('tenants_drivers')
        .findOne({tenant: `${tenant}`})
    return tenantDoc
}

async function updateTokenCreationDate(tenant:string, newDate: string): Promise<void> {
    const db: Db = client.db(dbName)
    db.collection('tenants_drivers').updateOne(
        { tenant: `${tenant}` },
        {
          $set: { "properties.token_creation_date": `${newDate}` },
        }
     )
}

async function updateAccessToken(tenant: string, newToken: string): Promise<void> {
    const db: Db = client.db(dbName)
    db.collection('tenants_drivers').updateOne(
        { tenant: `${tenant}` },
        {
          $set: { "properties.access_token": `${newToken}` },
        }
     )
}

export { getTenantConfig, updateAccessToken, updateTokenCreationDate }
