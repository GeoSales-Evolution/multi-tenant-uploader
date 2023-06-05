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

async function saveFile(tenant: string, file: UploadSuccess): Promise<void> {
    const db: Db = client.db(dbName)
    db.collection('tenants_drivers').updateOne(
        {tenant: `${tenant}`},
        {$push: { "properties.saved_files": {
            cdFile: file.cdFile,
            obfuscatedLink: file.obfuscatedLink,
            id: file.id,
            status: file.status,
            name: file.name,
            path: file.path,
            size: file.size,
            mimeType: file.mimeType,
        }}}
    )
}

export {
    getTenantConfig,
    updateAccessToken,
    updateTokenCreationDate,
    saveFile,
}
