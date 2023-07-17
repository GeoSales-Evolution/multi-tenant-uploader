import express from 'express'
import * as contentDisposition from 'content-disposition'
import bodyParser from 'body-parser'
import { config as dotenvConfig } from "dotenv-safe"
import { getTenantConfig, getUploadMetadataById } from '../db/db.js'
import { downloadFile, initializeDriver, uploadFile } from '../drivers/driver_manager.js'

const MAX_SHARED_API_FILE_SIZE = '15mb'
const app = express()
app.use(bodyParser.raw({type: 'application/octet-stream', limit : MAX_SHARED_API_FILE_SIZE}))

dotenvConfig()

const authUrl = process.env.URL_AUTH_SERVICE;
const whitelistedIPs = process.env.WHITELISTED_IP?.split(",")

app.post('/upload/:tenant', handleUpload)
app.get('/download/:tenant/:idFile', handleDownload)

app.get('/about', (req: express.Request, res: express.Response) => {
    res.send('This the Uploader App.')
})

async function handleUpload(req: express.Request, res: express.Response) {
    if (req.headers['content-type'] !== 'application/octet-stream') {
        console.error(`Bad Request at ${new Date()}`)
        res.status(400).send('Bad Request')
        return
    }

    const checkinResponse = await checkin(req)
    if (checkinResponse.status !== 200) {
        console.error(`${checkinResponse.errorMessage} at ${new Date()}`)
        res.status(checkinResponse.status).send(checkinResponse.errorMessage)
        return
    }

    const filename: string = getFilename(req)
    const uploadJsonResponse = await uploadFile(req.body, filename)

    if ('errorMessage' in uploadJsonResponse) {
        console.error(`Error uploading file. at ${new Date()}\n${uploadJsonResponse.errorMessage}`)
        res.status(500).send('Error uploading file.')
        return
    }

    res.status(uploadJsonResponse.status).send(uploadJsonResponse)
    return
}

async function handleDownload(req: express.Request, res: express.Response) {
    const fileMetadata = await getUploadMetadataById(req.params.idFile)
    if (!fileMetadata) {
        console.error(`File metadata was not found at ${new Date()}`)
        res.status(404).send(`File metadata was not found.`)
        return
    }

    const checkinResponse = await checkin(req)
    if (checkinResponse.status !== 200) {
        console.error(`${checkinResponse.errorMessage!} at ${new Date()}`)
        res.status(checkinResponse.status).send(checkinResponse.errorMessage!)
        return
    }

    const downloadJsonResponse = await downloadFile(fileMetadata.id_file_driver)

    if ('errorMessage' in downloadJsonResponse) {
        console.error(`Error downloading file at ${new Date()}\n${downloadJsonResponse.errorMessage}`)
        res.status(downloadJsonResponse.status).send(downloadJsonResponse.errorMessage)
        return
    }

    res.set('Content-Type', `${downloadJsonResponse.mimeType}`)
    res.set('Content-Disposition', `atachment; filename=${downloadJsonResponse.name}`)

    res.send(downloadJsonResponse.buffer)
}

async function checkin(req: express.Request): Promise<ServerError> {
    const authResult = await handleAuth(req);
    if (authResult.status !== 200) {
        return authResult
    }

    const configResult = await handleTenantAndDriverConfig(req);
    if (configResult.status !== 200) {
        return configResult
    }

    return {
        status: 200,
        errorMessage: '',
    }
}

async function handleAuth(req: express.Request): Promise<ServerError> {
    const authOk = {
        status: 200,
        errorMessage: '',
    }

    console.log(req.ip)

    if (isIPAuthorized(req.ip)) {
        return authOk
    }

    const authHeader = req.headers['authorization']
    if (!authHeader) {
        return {
            status: 401,
            errorMessage: 'Missing Authorization header'
        }
    }

    const token = authHeader?.split(' ')[1]
    if (!token) {
        return {
            status: 401,
            errorMessage: 'Missing bearer token'
        }
    }

    const authResponse = await makeAuth(authUrl, token, req.params.tenant)

    if (authResponse.status !== 200) {
        console.error(`Error authenticating user. Caused by:
            ${'errorMessage' in authResponse ?
                authResponse.errorMessage :
                `Authentication service returned status ${authResponse.status}`} at ${new Date()}`)
        return {
            status: 401,
            errorMessage: 'Error trying authentication.'
        }
    }

    return authOk
}

async function handleTenantAndDriverConfig(req: express.Request): Promise<ServerError> {
    const tenantConfig = await getTenantConfig(req.params.tenant);

    if (!tenantConfig) {
        return {
            status: 404,
            errorMessage: 'Tenant not found.'
        }
    }

    if (!tenantConfig.driver) {
        return {
            status: 404,
            errorMessage: `Driver for tenant ${req.params.tenant} not found`
        }
    }

    if (!initializeDriver(tenantConfig)) {
        return {
            status: 404,
            errorMessage: 'Driver not found.'
        }
    }

    return {
        status: 200,
        errorMessage: ''
    }
}

async function makeAuth(authUrl: string | undefined, token: string, tenant: string): Promise<AuthStatus | ServerError> {
    const authParams = new URLSearchParams({
        token: token,
        tenant: tenant
    })

    try {
      const response = await fetch(`${authUrl}?${authParams}`);
        return {status: response.status};
    } catch (error: any) {
        return {
            status: 500,
            errorMessage: error
        }
    }
}

function getFilename(req: express.Request): string {
    try {
        const dispositionHeader: string | undefined = req.headers['content-disposition']
        const disposition: contentDisposition.ContentDisposition | null = dispositionHeader
            ? contentDisposition.parse(dispositionHeader)
            : null

        return disposition?.parameters.filename || 'default-filename'
    } catch (error: any) {
        console.error(error)
        return 'default-filename'
    }
}

function isIPAuthorized(clientIP: string): boolean {
    return whitelistedIPs?.includes(clientIP) as boolean
}

export default app
