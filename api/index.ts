import * as contentDisposition from 'content-disposition'
import express from 'express'
import * as fs from 'fs'
import * as path from 'path'
import axios from 'axios'

const app = express()
const port: number = 3003


app.post('/:token/:tenant', (req, res) => {
  const { token, tenant } = req.params;
  console.log(`Received token: ${token}, tenant: ${tenant}`);
  res.send(`Token: ${token}, Tenant: ${tenant}`);
});


app.post('/upload/:token/:tenant', (req: express.Request, res: express.Response) => {
  const authUrl = "http://localhost:8090/authToken";

  if (req.headers['content-type'] === 'application/octet-stream') {
    const authParams = {
      params:{
        token: req.params.token,
        tenant: req.params.tenant
      }
    };

    let data: Buffer[] = []
    const filename: string = getFilename(req)

    axios.get(authUrl, authParams)
      .then((response) => {
        if(response.status == 200) {
          console.log("$$$$$$")

          req.on('data', (chunk: Buffer) => {
            data.push(chunk)
          })
      
          req.on('end', () => {
            fs.writeFile(path.join(__dirname, '../uploads/', filename), Buffer.concat(data), (err: NodeJS.ErrnoException | null) => {
              if (err) {
                console.error(err)
                res.status(500).send('Error saving file')
              } else {
                console.log('File saved')
                res.end(`File ${filename} saved.`)
              }
            })
          })
        } else {
          res.end(`Auth failed.`)
        }
      })
      .catch((error) => {
        console.error(error);
        res.end(`Error while requesting auth.`);
      }
    );
  } else {
    res.status(400).end('Bad Request')
  }
})

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`)
})

function getFilename(req: express.Request): string {
  const dispositionHeader: string | undefined = req.headers['content-disposition']
  const disposition: contentDisposition.ContentDisposition | null = dispositionHeader
    ? contentDisposition.parse(dispositionHeader)
    : null

  return disposition?.parameters.filename || 'default-filename.txt'
}