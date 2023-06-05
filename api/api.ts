import express from 'express'
import * as contentDisposition from 'content-disposition'
import bodyParser from 'body-parser'
import checkin from './checkin.js'
import { uploadFile, downloadFile } from '../drivers/driver_manager.js'

const MAX_SHARED_API_FILE_SIZE = '5mb'
const app = express()
app.use(bodyParser.raw({type: 'application/octet-stream', limit : MAX_SHARED_API_FILE_SIZE}))

app.post('/upload/:tenant', async (req: express.Request, res: express.Response) => {
    if (req.headers['content-type'] !== 'application/octet-stream') {
        console.error(`Bad Request at ${new Date()}`)
        res.status(400).send('Bad Request')
        return
    }

    const checkinResult = await checkin(req.headers['authorization'] as string, req.params.tenant)

    if (checkinResult != null) {
        console.error(`${checkinResult.errorMessage} at ${new Date()}`)
        res.status(checkinResult.status).send(checkinResult.errorMessage)
        return
    }

    const filename: string = getFilename(req)
    const uploadJsonResponse = await uploadFile(req.body, filename)

    if ('errorMessage' in uploadJsonResponse) {
        console.error(`Error uploading file at ${new Date()}\n${uploadJsonResponse.errorMessage}`)
        res.status(500).send('Error uploading file.')
        return
    }

    res.status(uploadJsonResponse.status).send(uploadJsonResponse)
    return
})

app.get('/download/:tenant/:idFile', async (req: express.Request, res: express.Response) => {
    const checkinResult = await await checkin(req.headers['authorization'] as string, req.params.tenant)

    if (checkinResult != null) {
        console.error(`${checkinResult.errorMessage} at ${new Date()}`)
        res.status(checkinResult.status).send(checkinResult.errorMessage)
        return
    }

    const downloadJsonResponse =  await downloadFile(req.params.idFile)

    if ('errorMessage' in downloadJsonResponse) {
        console.error(`Error downloading file at ${new Date()}\n${downloadJsonResponse.errorMessage}`)
        res.status(downloadJsonResponse.status).send('Error downloading file.')
        return
    }

    const readableResponse = await fetch(downloadJsonResponse.downloadLink)

    const blob = await readableResponse.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = await Buffer.from(arrayBuffer)

    res.set('Content-Type', `${downloadJsonResponse.mimeType}`)
    res.set('Content-Disposition', `atachment; filename=${downloadJsonResponse.name}`)

    res.send(buffer)
})

function getFilename(req: express.Request): string {
    const dispositionHeader: string | undefined = req.headers['content-disposition']
    const disposition: contentDisposition.ContentDisposition | null = dispositionHeader
        ? contentDisposition.parse(dispositionHeader)
        : null

    return disposition?.parameters.filename || 'default-filename.txt'
}

export default app
