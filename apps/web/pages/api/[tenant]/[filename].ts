import type { NextApiRequest, NextApiResponse } from 'next'

type RequestData = {
  filename: string,
  tenant: string,
  token: string,
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const method: string | undefined = req.method
    switch (method) {
      case "POST":
        const filename: any = req.query.filename
        const tenant: any = req.query.tenant
        const token: any = req.headers.token

        const requestData: RequestData = {
          filename: filename,
          tenant: tenant,
          token: token,
        }
        res.status(200).send(`File ${requestData.filename} was uploaded successfully!`)
        break
      default:
        res.status(405).end(`Method ${method} not allowed.`)
    }
  } catch (err) {
    res.status(500).send(`${ err }`);
  }
}
