import * as fs from 'fs'

class FileSystemDriver implements Driver {
    uploadFolder: string

    constructor(uploadFolder: string) {
        this.uploadFolder = uploadFolder
    }

    async uploadFile(fileBytes: any, filename: string): Promise<any> {
        if (!fs.existsSync(this.uploadFolder)) {
            fs.mkdirSync(this.uploadFolder)
        }
        fs.writeFileSync(`${this.uploadFolder}/${filename}`, fileBytes);
        return {
            "name": `${filename}`,
            status: 200,
            msg: `File ${filename} saved successfully`,
            path: `${this.uploadFolder}/`,
        }
    }

    async downloadFile(idFile: string): Promise<string | null> {
        return null
    }
}

export default FileSystemDriver
