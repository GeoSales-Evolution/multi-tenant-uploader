import { updateAccessToken, saveFile, updateTokenCreationDate } from "../db/db.js"
import hash from 'string-hash'

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

    constructor(tenantConfig: TenantConfig) {
        this.tenant =  tenantConfig.tenant,
        this.accessToken = tenantConfig!.properties.access_token!,
        this.tokenCreationDate = tenantConfig!.properties.token_creation_date!,
        this.tokenUrl = tenantConfig!.properties.token_url!,
        this.uploadUrl = tenantConfig!.properties.upload_url!,
        this.downloadUrl = tenantConfig!.properties.download_url!,
        this.uploadFolder = tenantConfig!.properties.upload_folder,
        this.clientId = tenantConfig!.properties.client_id!,
        this.clientSecret = tenantConfig!.properties.client_secret!,
        this.grantType = tenantConfig!.properties.grant_type!
        this.scope = tenantConfig!.properties.scope!
    }

    async uploadFile(fileBytes: any, filename: string): Promise<UploadSuccess | Err> {
        const UPLOADER_SERVICE = process.env.UPLOADER_SERVICE;
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
            } else {
                const cdFile = hash(uploadJson.id)
                const file: UploadSuccess = {
                    cdFile: cdFile,
                    obfuscatedLink: `${UPLOADER_SERVICE}/download/${this.tenant}/${cdFile}`,
                    id: uploadJson.id,
                    status: uploadResponse.status,
                    name: uploadJson.name,
                    path: uploadJson.parentReference.path,
                    size: uploadJson.size,
                    mimeType: uploadJson.file.mimeType,
                }
                await saveFile(this.tenant, file)
                return file
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

    async downloadFile(idFile: string): Promise<DownloadSuccess | Err> {
        await this.refreshTokenIfNeeded()

        try {
            const downloadResponse = await fetch(
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
            const downloadJson = await downloadResponse.json()

            if (downloadResponse.status !== 200) {
                console.log(`${downloadJson.error.message}`)
                return {
                    status: downloadResponse.status,
                    errorMessage: downloadJson.error.message
                }
            } else {
                return {
                    id: downloadJson.id,
                    status: downloadResponse.status,
                    msg: `File ${downloadJson.name} was downloaded succesfully`,
                    downloadLink: `${downloadJson['@microsoft.graph.downloadUrl']}`,
                    name: downloadJson.name,
                    mimeType: downloadJson.file.mimeType,
                }
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
        } catch (error) {
            console.log('Token generation failed.')
            console.log(error)
            return null
        }
    }

    generateArbitraryId(): number {
        return Math.random() * (999999999 - 1) + 1;
    }
}

export default OneDriveDriver
