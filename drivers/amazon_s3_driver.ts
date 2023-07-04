class AmazonS3Driver {
    tenant: string
    accessKeyId: string
    secretAccessKey: string
    region: string
    bucket: string
    uploadFolder: string

    constructor(tenantConfig: AmazonS3Config) {
        this.tenant =  tenantConfig.tenant,
        this.accessKeyId = tenantConfig.properties.access_key_id!,
        this.secretAccessKey = tenantConfig.properties.secret_access_key!,
        this.region = tenantConfig.properties.region!,
        this.bucket = tenantConfig.properties.bucket!,
        this.uploadFolder = tenantConfig.properties.upload_folder
    }
}

export default AmazonS3Driver
