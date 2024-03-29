import { getUploadMetadataById, storeSavedFileMetadata, updateAccessToken, updateTokenCreationDate } from "../db/db.js"

class OneDriveDriver implements Driver {
    tenant: string
    accessToken: string
    tokenCreationDate: string
    tokenUrl: string
    uploadUrl: string
    downloadUrl: string
    uploadFolder: string
    clientId: string
    clientSecret: string
    grantType: string
    scope: string

    constructor(tenantConfig: OneDriveConfig) {
        this.tenant =  tenantConfig.tenant,
        this.accessToken = tenantConfig.properties.access_token!,
        this.tokenCreationDate = tenantConfig.properties.token_creation_date!,
        this.tokenUrl = tenantConfig.properties.token_url!,
        this.uploadUrl = tenantConfig.properties.upload_url!,
        this.downloadUrl = tenantConfig.properties.download_url!,
        this.uploadFolder = tenantConfig.properties.upload_folder,
        this.clientId = tenantConfig.properties.client_id!,
        this.clientSecret = tenantConfig.properties.client_secret!,
        this.grantType = tenantConfig.properties.grant_type!
        this.scope = tenantConfig.properties.scope!
    }

    async uploadFile(fileBytes: any, filename: string): Promise<UploadSuccess | ServerError> {
        await this.refreshTokenIfNeeded()
        try {
            const uploadResponse = await fetch(
                `${this.uploadUrl}/`
                + `${this.uploadFolder}/`
                + `${filename}:/`
                + `content?@microsoft.graph.conflictBehavior=rename`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'Authorization': `Bearer ${this.accessToken}`
                    },
                    body: fileBytes
                }
            )
            const uploadJson = await uploadResponse.json()

            if (uploadResponse.status !== 200 && uploadResponse.status !== 201) {
                console.log(`${uploadJson.error.message}`)
                return {
                    status: uploadResponse.status,
                    errorMessage: uploadJson.error.message
                }
            }

            const idFromDB = await storeSavedFileMetadata({
                tenant: this.tenant,
                driver: "one_drive",
                id_file_driver: uploadJson.id,
                name: uploadJson.name,
                path: uploadJson.parentReference.path,
                size: uploadJson.size,
                mime_type: uploadJson.file.mimeType,
                creation_date: uploadJson.createdDateTime,
            })

            if (!idFromDB) {
                return {
                    status: 500,
                    errorMessage: "Upload Failed. Try again later.",
                }
            }

            return {
                id: idFromDB,
                status: uploadResponse.status,
                msg: `File ${filename} saved as ${uploadJson.name}`,
                createdDateTime: uploadJson.createdDateTime,
                name: uploadJson.name,
                path: uploadJson.parentReference.path,
                size: uploadJson.size,
                mimeType: uploadJson.file.mimeType,
            }
        } catch (error) {
            console.log('Upload failed. Could not upload to OneDrive.')
            console.log(error)
            return {
                status: 500,
                errorMessage: 'Upload failed. Could not upload to OneDrive.'
            }
        }
    }

    async downloadFile(idFile: string): Promise<DownloadSuccess | ServerError> {
        await this.refreshTokenIfNeeded()
        try {
            const oneDriveFileMetadata = await fetch(
                `${this.downloadUrl}/`
                + `${idFile}`
                + `?select=id,@microsoft.graph.downloadUrl,name,file`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            )
            const fileMetadataJSON = await oneDriveFileMetadata.json()

            if (oneDriveFileMetadata.status !== 200) {
                console.log(`${fileMetadataJSON.error.message}`)
                return {
                    status: oneDriveFileMetadata.status,
                    errorMessage: fileMetadataJSON.error.message
                }
            }

            const fileBytesOneDrive: Response = await fetch(`${fileMetadataJSON['@microsoft.graph.downloadUrl']}`)
            const buffer = await this.convert2buffer(fileBytesOneDrive)

            return {
                buffer: buffer,
                name: fileMetadataJSON.name,
                mimeType: fileMetadataJSON.file.mimeType,
            }
        } catch (error) {
            console.log('Download failed. Could not download to OneDrive.')
            console.log(error)
            return {
                status: 500,
                errorMessage: 'Download failed. Could not download to OneDrive.'
            }
        }
    }

    async refreshTokenIfNeeded(): Promise<void> {
        const currentDate: Date = new Date()
        const tokenBirth: Date = new Date(this.tokenCreationDate)

        const diffTime: any = currentDate.getTime() - tokenBirth.getTime()

        if (diffTime < 0 || diffTime > (3599 * 1000)) {
            console.log("Invalid Token. Generating a new one. Please, wait...")
            const accessToken = await this.generateToken()

            if (!accessToken) {
                console.log(`Upload failed. Could not generate token for ${this.tenant}.`)
                return
            }

            this.accessToken = accessToken
            await updateTokenCreationDate(this.tenant, currentDate.toISOString())
            console.log(`Token to ${this.tenant} was generated.`)
        }
    }

    async generateToken(): Promise<string | null> {
        try {
            console.log('Trying to generate a new token. Please wait...')

            const tokenResponse = await fetch(`${this.tokenUrl}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        'client_id': `${this.clientId}`,
                        'client_secret': `${this.clientSecret}`,
                        'grant_type': `${this.grantType}`,
                        'scope': `${this.scope}`,
                    })
                }
            )
            const tokenJsonResponse = await tokenResponse.json()
            await updateAccessToken(this.tenant, tokenJsonResponse.access_token)
            return tokenJsonResponse.access_token
        } catch (error){
            console.log('Token generation failed.')
            console.log(error)
            return null
        }
    }

    async convert2buffer(fileBytesOneDrive: Response): Promise<Buffer> {
        const blob = await fileBytesOneDrive.blob()
        const arrayBuffer = await blob.arrayBuffer()
        return await Buffer.from(arrayBuffer)
    }
}

export default OneDriveDriver
