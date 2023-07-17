import { MongoClient, Db, ObjectId } from 'mongodb'
import { config as dotenvConfig } from "dotenv-safe"

dotenvConfig()

const dbName: string | undefined = process.env.DB_NAME;
const mongoUrl: string = process.env.MONGO_URL || ''

const client: MongoClient = new MongoClient(mongoUrl);

try {
    await client.connect()
    console.log('Connected successfully to Mongo Database')
} catch (error: any) {
    throw error
}

async function getTenantConfig(tenant: string): Promise<TenantConfig | null> {
    const db: Db = client.db(dbName)
    const tenantDoc = await db.collection('tenant_driver')
        .findOne({tenant: `${tenant}`})

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

async function storeSavedFileMetadata(file: FileMetadata): Promise<string | null> {
    const db: Db = client.db(dbName)

    const fileMetadata = await db.collection('arquivo')
        .insertOne(file)

    if (!fileMetadata.acknowledged) {
        console.error(`ERROR: The metadata of file ${file.name}  was not stored in database`)
        return null
    }

    console.log(`The metadata of file ${file.name} was successfully stored in database`)
    return fileMetadata.insertedId.toString()
}

async function getUploadMetadataById(id: string): Promise<FileMetadata | null> {
    const db: Db = client.db(dbName)
    try {
        const fileFromDB = await db.collection('arquivo')
            .findOne({"_id" : new ObjectId(id)})

        return fileFromDB != null ? {
            tenant: fileFromDB.tenant,
            driver: fileFromDB.driver,
            id_file_driver: fileFromDB.id_file_driver,
            name: fileFromDB.name,
            path: fileFromDB.path,
            size: fileFromDB.size,
            mime_type: fileFromDB.mime_type,
            creation_date: fileFromDB.creation_date,
        }: null
    } catch (error) {
        console.error(error)
        return null
    }
}

export {
    getTenantConfig,
    updateAccessToken,
    updateTokenCreationDate,
    storeSavedFileMetadata,
    getUploadMetadataById,
}
