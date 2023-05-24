import { updateAccessToken } from "../db/db.js"
import { OneDriveDriver } from "./drivers"

const oneDriveBuilder = (tenantConfig: any): OneDriveDriver => {
    return {
        upload_folder: tenantConfig.properties.upload_folder,
        limit_file_size: tenantConfig.properties.limit_file_size,
        access_token: tenantConfig.properties.access_token,
        token_url: tenantConfig.properties.token_url,
        upload_url: tenantConfig.properties.upload_url,
        client_id: tenantConfig.properties.client_id,
        client_secret: tenantConfig.properties.client_secret,
        grant_type: tenantConfig.properties.grant_type,
        scope: tenantConfig.properties.scope,
        makeAuth: async (): Promise<boolean> => {
            const checkTokenResult = await fetch(`https://graph.microsoft.com/v1.0/users`,
                {
                    headers: {
                        Authorization: `Bearer ${tenantConfig.properties.access_token}`
                    }
                }
            )

            if (checkTokenResult.status !== 200) {
                const error = await checkTokenResult.json()
                console.log(`${error.error.message}`)
                return false
            }

            return true
        },
        uploadFile: async (bytes: any, filename: string): Promise<any> => {
            const uploadResponse = await fetch(
                `${tenantConfig.properties.upload_url}/`
                + `${tenantConfig.properties.upload_folder}/`
                + `${filename}:/`
                + `content?@microsoft.graph.conflictBehavior=rename`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'Authorization': `Bearer ${tenantConfig.properties.access_token}`
                    },
                    body: bytes
                }
            )

            const uploadJson = await uploadResponse.json()
            if (uploadResponse.status !== 200 && uploadResponse.status !== 201) {
                console.log(`${uploadJson.error.message}`)
                throw new Error(`${uploadJson.error.message}`)
            }

            return uploadJson
        },
        generateToken: async () => {
            console.log('Generating a new token. Please wait...')

            const tokenResponse = await fetch(`${tenantConfig.properties.token_url}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        'client_id': `${tenantConfig.properties.client_id}`,
                        'client_secret': `${tenantConfig.properties.client_secret}`,
                        'grant_type': `${tenantConfig.properties.grant_type}`,
                        'scope': `${tenantConfig.properties.scope}`,
                    })
                }
            )

            const tokenJsonResponse = await tokenResponse.json()
            await updateAccessToken(tenantConfig.tenant, tokenJsonResponse.access_token)
            return tokenJsonResponse.access_token
        }
    }
}

export default oneDriveBuilder
