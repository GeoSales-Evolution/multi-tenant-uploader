import express from 'express'
import * as contentDisposition from 'content-disposition'
import bodyParser from 'body-parser'
import { config as dotenvConfig } from "dotenv-safe"
import { getTenantConfig, getUploadMetadataById } from '../db/db.js'
import { downloadFile, initializeDriver, uploadFile } from '../drivers/driver_manager.js'

const MAX_SHARED_API_FILE_SIZE = '5mb'
const app = express()
app.use(bodyParser.raw({type: 'application/octet-stream', limit : MAX_SHARED_API_FILE_SIZE}))

dotenvConfig()

const authUrl = process.env.URL_AUTH_SERVICE;

app.post('/upload/:tenant', async (req: express.Request, res: express.Response) => {
    if (req.headers['content-type'] !== 'application/octet-stream') {
        console.error(`Bad Request at ${new Date()}`)
        res.status(400).send('Bad Request')
        return
    }

    const driverHeader = req.headers['driver'] as string
    if (!driverHeader) {
        console.error(`Missing driver header at ${new Date()}`)
        res.status(400).send('Missing driver header')
        return
    }

    const authHeader = req.headers['authorization']
    if (!authHeader) {
        console.error(`Missing Authorization header at ${new Date()}`)
        res.status(401).send('Missing Authorization header')
        return
    }

    const token = authHeader?.split(' ')[1]
    if (!token) {
        console.error(`Request missing bearer token at ${new Date()}`)
        res.status(401).send('Missing bearer token')
        return
    }

    const authResponse = await makeAuth(authUrl, token, req.params.tenant)

    if (authResponse.status !== 200) {
        console.error(`Error authenticating user. Caused by:
        ${'errorMessage' in authResponse ? authResponse.errorMessage : `Authentication service returned status ${authResponse.status}`}
        at ${new Date()}`)
        res.status(authResponse.status).send('Error trying authentication.')
        return
    }

    const filename: string = getFilename(req)
    const tenantConfig = await getTenantConfig(req.params.tenant, driverHeader)

    if (!tenantConfig) {
        console.error(`Tenant not found at ${new Date()}`)
        res.status(404).send('Tenant not found.')
        return
    }

    if (!tenantConfig.driver) {
        console.error(`Driver for tenant ${req.params.tenant} not found at ${new Date()}`)
        res.status(404).send(`Driver for tenant ${req.params.tenant} not found`)
        return
    }

    if (!initializeDriver(tenantConfig)) {
        console.error(`Driver not found at ${new Date()}`)
        res.status(404).send('Driver not found.')
        return
    }

    const uploadJsonResponse = await uploadFile(req.body, filename)

    if ('errorMessage' in uploadJsonResponse) {
        console.error(`Error uploading file. at ${new Date()}\n${uploadJsonResponse.errorMessage}`)
        res.status(500).send('Error uploading file.')
        return
    }

    res.status(uploadJsonResponse.status).send(uploadJsonResponse)
    return
})

app.get('/download/:tenant/:idFile', async (req: express.Request, res: express.Response) => {
    const authHeader = req.headers['authorization']
    if (!authHeader) {
        console.error(`Missing Authorization header at ${new Date()}`)
        res.status(401).send('Missing Authorization header')
        return
    }

    const token = authHeader?.split(' ')[1]
    if (!token) {
        console.error(`Request missing bearer token at ${new Date()}`)
        res.status(401).send('Missing bearer token')
        return
    }

    const authResponse = await makeAuth(authUrl, token, req.params.tenant)

    if (authResponse.status !== 200) {
        console.error(`Error authenticating user. Caused by:
        ${'errorMessage' in authResponse ? authResponse.errorMessage : `Authentication service returned status ${authResponse.status}`}
        at ${new Date()}`)
        res.status(authResponse.status).send('Error trying authentication.')
        return
    }

    const fileMetadata = await getUploadMetadataById(req.params.idFile)
    if (!fileMetadata) {
        console.error(`File metadata was not found at ${new Date()}`)
        res.status(404).send(`File metadata was not found not found`)
        return
    }

    const tenantConfig = await getTenantConfig(req.params.tenant, fileMetadata.driver)

    if (!tenantConfig) {
        console.error(`Tenant not found at ${new Date()}`)
        res.status(404).send('Tenant not found.')
        return
    }

    if (!initializeDriver(tenantConfig)) {
        console.error(`Driver not found at ${new Date()}`)
        res.status(404).send('Driver not found.')
        return
    }

    const downloadJsonResponse =  await downloadFile(fileMetadata.id_file_driver)

    if ('errorMessage' in downloadJsonResponse) {
        console.error(`Error downloading file at ${new Date()}\n${downloadJsonResponse.errorMessage}`)
        res.status(downloadJsonResponse.status).send(downloadJsonResponse.errorMessage)
        return
    }

    res.set('Content-Type', `${downloadJsonResponse.mimeType}`)
    res.set('Content-Disposition', `atachment; filename=${downloadJsonResponse.name}`)

    res.send(downloadJsonResponse.buffer)
})

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
    const dispositionHeader: string | undefined = req.headers['content-disposition']
    const disposition: contentDisposition.ContentDisposition | null = dispositionHeader
        ? contentDisposition.parse(dispositionHeader)
        : null

    return disposition?.parameters.filename || 'default-filename.txt'
}

export default app
