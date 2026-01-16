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

async function setTenantConfig(tenant: string, config: Record<string, string>): Promise<void> {
    const db: Db = client.db(dbName);
    const collection = db.collection('tenant_driver');

    const driverType = config.driver;

    const tenantDoc = await collection.findOne({ tenant });

    let driverConfig: any;
    if (driverType === 'one_drive') {
        driverConfig = {
            type: driverType,
            properties: generateOneDriveProperties(config),
        };
    } else if (driverType === 'amazon_s3') {
        driverConfig = {
            type: driverType,
            properties: generateAmazonS3Properties(config),
        };
    }

    if (!tenantDoc) {
        await collection.insertOne({
            tenant,
            drivers: [driverConfig]
        });
    } else {
        await collection.updateOne(
            { tenant, "drivers.type": driverType },
            { $set: { "drivers.$.properties": { ...driverConfig.properties } } },
            { upsert: true }
        );
    }
}

function generateOneDriveProperties(input: any): any {
    return {
        access_token: "",
        user_id: "",
        tenant_id: input.tenant_id,
        client_id: input.client_id,
        client_secret: input.client_secret,
        limit_file_size: "15mb",
        grant_type: "client_credentials",
        scope: "https://graph.microsoft.com/.default",
        token_url: `https://login.microsoftonline.com/${input.tenant_id}/oauth2/v2.0/token`,
        upload_url: `https://graph.microsoft.com/v1.0/users/<USER_ID>/drive/root:`,
        upload_folder: "uploaderFolder",
        download_url: `https://graph.microsoft.com/v1.0/users/<USER_ID>/drive/items`,
        token_creation_date: new Date(1, 0, 1).toDateString()
      };
}

async function updateUrlsAndUserId(tenant: string, userId: string, uploadUrl: string, downloadUrl: string): Promise<void> {
    const db: Db = client.db(dbName)

    db.collection('tenant_driver').updateOne(
        { tenant: `${tenant}` },
        {
            $set: {
                "drivers.$[i].properties.user_id": userId,
                "drivers.$[i].properties.upload_url": uploadUrl,
                "drivers.$[i].properties.download_url": downloadUrl,
            }
        },
        {arrayFilters: [{"i.type": "one_drive"}]}
     )
}

function generateAmazonS3Properties(input: any): any {
    return {
        access_key_id: input.access_key_id,
        secret_access_key: input.secret_access_key,
        region: input.region,
        bucket: input.bucket,
        upload_folder: "uploaderFolder"
    }
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
    setTenantConfig,
    getTenantConfig,
    updateUrlsAndUserId,
    updateAccessToken,
    updateTokenCreationDate,
    storeSavedFileMetadata,
    getUploadMetadataById,
}
