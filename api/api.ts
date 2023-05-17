import express from 'express'
import bodyParser from 'body-parser'
import * as contentDisposition from 'content-disposition'
import { config as dotenvConfig } from "dotenv-safe"

const app = express()

app.use(bodyParser.raw({type: 'application/octet-stream', limit : '4mb'}))

dotenvConfig()

const authUrl = process.env.URL_AUTH_SERVICE
let accessToken = process.env.TOKEN
const token_url = process.env.TOKEN_URL
const upload_url = process.env.UPLOAD_URL
const client_id = process.env.CLIENT_ID
const client_secret = process.env.CLIENT_SECRET
const grant_type = process.env.GRANT_TYPE
const scope = process.env.SCOPE
const upload_folder = process.env.UPLOAD_FOLDER

app.post('/upload/:tenant', async (req: express.Request, res: express.Response) => {
    try {
        if (req.headers['content-type'] !== 'application/octet-stream') {
            throw new Error('Bad Request')
        }

        const authHeader = req.headers['authorization']
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        const authToken = authHeader?.split(' ')[1]
        if (!authToken) {
            throw new Error('Missing bearer token')
        }

        const authParams = new URLSearchParams({
            token: authToken,
            tenant: req.params.tenant
        });

        const authResponse = await fetch(`${authUrl}?${authParams}`)
        if (authResponse.status !== 200) {
            throw new Error('Error fetching Authentication API')
        }

        const filename: string = getFilename(req)

        const checkTokenResult = await fetch(`https://graph.microsoft.com/v1.0/users`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )

        if (checkTokenResult.status !== 200) {
            const error = await checkTokenResult.json()
            console.log(`${error.error.message}`)
            console.log('Generating a new token. Please wait...')

            const tokenResponse = await fetch(`${token_url}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        'client_id': `${client_id}`,
                        'client_secret': `${client_secret}`,
                        'grant_type': `${grant_type}`,
                        'scope': `${scope}`,
                    })
                }
            )

            const tokenJsonResponse = await tokenResponse.json()
            accessToken = tokenJsonResponse.access_token
        }

        const uploadResponse = await fetch(`${upload_url}/${upload_folder}/${filename}:/content`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: req.body
            }
        )

        if (uploadResponse.status !== 200 && uploadResponse.status !== 201) {
            const error = await uploadResponse.json()
            console.log(`${error.error.message}`)
            throw new Error(`${error.error.message}`)
        }

        console.log(`File ${filename} saved`)
        res.status(200).send(`File ${filename} saved.`)
    } catch (error: any) {
        console.error(error)
        if (error.message === 'Missing Authorization header' || error.message === 'Missing bearer token') {
            res.status(401).send(error.message)
        } else if (error.message === 'Bad Request') {
            res.status(400).send(error.message)
        } else {
            res.status(500).send(error.message)
        }
    }
})

function getFilename(req: express.Request): string {
    const dispositionHeader: string | undefined = req.headers['content-disposition']
    const disposition: contentDisposition.ContentDisposition | null = dispositionHeader
        ? contentDisposition.parse(dispositionHeader)
        : null

    return disposition?.parameters.filename || 'default-filename.txt'
}

export default app
