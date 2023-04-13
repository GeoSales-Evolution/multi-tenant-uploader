import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'

type RequestData = {
  filenames: string[],
  tenant: string,
  token: string,
}

export const config = {
  api: {
    bodyParser: false
  }
}

const form = formidable({ multiples: true });

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "POST":
        form.parse(req, (err, fields, files) => {
          const tenant: any = req.query.tenant
          const token: any = req.headers.token

          const requestData: RequestData = {
            filenames: [],
            tenant: tenant,
            token: token,
          }

          const fileKeys: string[] = Object.keys(files)

          fileKeys.forEach((key: string) => {
            const oldPath: string = files[key].filepath
            const newPath: string = "./uploads/"
            const newPathFile: string = `${newPath}${files[key].originalFilename}`

            if (!fs.existsSync(newPath)) {
              fs.mkdirSync(newPath);
            }

            fs.rename(oldPath, newPathFile, function (err) {
                if (err) throw err;
            })

            requestData.filenames.push(files[key].originalFilename)
          })
        });
        res.send(`The files were uploaded succesfully.`)
        break
      default:
        res.status(405).end(`Method ${method} not allowed.`)
    }
  } catch (err) {
    res.status(500).send(`${ err }`);
  }
}
