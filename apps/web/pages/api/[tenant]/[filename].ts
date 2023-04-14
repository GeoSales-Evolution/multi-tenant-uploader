import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'

type DataToSave = {
  filename: string,
  tenant: string,
  token: string,
}

export const config = {
  api: {
    bodyParser: false
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "POST":
        let body: any = []

        const filename: any = req.query.filename
        const tenant: any = req.query.tenant
        const token: any = req.headers.token

        const dataToSave: DataToSave = {
          filename: filename,
          tenant: tenant,
          token: token,
        }

        req.on('data', (chunk) => {
          body.push(chunk)
        })

        req.on('end', () => {
          const data = Buffer.concat(body)

          fs.writeFile(`./uploads/${filename}`, data, (err) => {
            if (err) {
              console.error(err)
              res.statusCode = 500
            } else {
              res.statusCode = 200
            }
          })
        })
        res.end(`PDF file saved succesfully!`)
        break
      default:
        res.status(405).end(`Method ${method} not allowed.`)
    }
  } catch (err) {
    res.status(500).send(`${ err }`);
  }
}
