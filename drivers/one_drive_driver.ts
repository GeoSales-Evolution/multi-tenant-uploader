import { TenantConfig, UploaderResponse } from "../types.js"
import { updateAccessToken } from "../db/db.js"

class OneDriveDriver implements Driver {
    tenant: string
    accessToken: string
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
        this.tokenUrl = tenantConfig!.properties.token_url!,
        this.uploadUrl = tenantConfig!.properties.upload_url!,
        this.downloadUrl = tenantConfig!.properties.download_url!,
        this.uploadFolder = tenantConfig!.properties.upload_folder,
        this.clientId = tenantConfig!.properties.client_id!,
        this.clientSecret = tenantConfig!.properties.client_secret!,
        this.grantType = tenantConfig!.properties.grant_type!
        this.scope = tenantConfig!.properties.scope!
    }

    async uploadFile(fileBytes: any, filename: string): Promise<UploaderResponse> {
        const checkTokenResult = await fetch(`https://graph.microsoft.com/v1.0/users`,
            {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                }
            }
        )

        if (checkTokenResult.status !== 200) {
            const error = await checkTokenResult.json()
            console.log(`${error.error.message}`)
            this.accessToken = await this.generateToken()
        }

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
                error: uploadJson.error.message
            }
        } else {
            return {
                id: uploadJson.id,
                status: uploadResponse.status,
                msg: `File ${filename} saved as ${uploadJson.name}`,
                createdDateTime: uploadJson.createdDateTime,
                name: uploadJson.name,
                path: uploadJson.parentReference.path,
                size: uploadJson.size,
                mimeType: uploadJson.file.mimeType,
            }
        }
    }

    async downloadFile(idFile: string): Promise<string | null> {
        const downloadResponse = await fetch(
            `${this.downloadUrl}/`
            + `${idFile}`
            + `?select=id,@microsoft.graph.downloadUrl`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        )
        const downloadJsonResponse = await downloadResponse.json()
        return downloadJsonResponse['@microsoft.graph.downloadUrl']
    }

    async generateToken(): Promise<string> {
        console.log('Generating a new token. Please wait...')

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
    }
}

export default OneDriveDriver
