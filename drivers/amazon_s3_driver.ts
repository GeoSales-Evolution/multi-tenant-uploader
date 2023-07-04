import { fileTypeFromBuffer } from 'file-type';
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { storeSavedFileMetadata } from "../db/db.js"

class AmazonS3Driver {
    tenant: string
    accessKeyId: string
    secretAccessKey: string
    region: string
    bucket: string
    uploadFolder: string

    constructor(tenantConfig: AmazonS3Config) {
        this.tenant =  tenantConfig.tenant,
        this.accessKeyId = tenantConfig.properties.access_key_id!,
        this.secretAccessKey = tenantConfig.properties.secret_access_key!,
        this.region = tenantConfig.properties.region!,
        this.bucket = tenantConfig.properties.bucket!,
        this.uploadFolder = tenantConfig.properties.upload_folder
    }

    async uploadFile(fileBytes: any, filename: string): Promise<UploadSuccess | ServerError> {
        let s3Client = new S3Client({
            region: this.region,
            credentials: {
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey
            }
        })

        const props = {
            Bucket: this.bucket,
            Key: `${this.uploadFolder}/${filename}`,
            Body: fileBytes,
        }

        try {
            await s3Client.send(new PutObjectCommand(props))
            const fileType = await fileTypeFromBuffer(fileBytes) || {mime: 'text/plain'}
            const now = new Date()
            const idFromDB = await storeSavedFileMetadata({
                tenant: this.tenant,
                driver: "amazon_s3",
                id_file_driver: props.Key,
                name: filename,
                path: `${this.bucket}/${this.uploadFolder}`,
                size: null,
                mime_type: fileType?.mime!,
                creation_date: now,
            })

            if (!idFromDB) {
                return {
                    status: 500,
                    errorMessage: "Upload Failed. Try again later.",
                }
            }

            return {
                id: idFromDB,
                status: 201,
                msg: `File ${filename} uploaded successfully`,
                createdDateTime: now.toISOString(),
                name: filename,
                path: this.uploadFolder,
                size: null,
                mimeType: fileType?.mime!,
            }
        } catch (error) {
            console.log("Upload failed. Could not upload to AmazonS3.\n", error)
            return {
                status: 500,
                errorMessage: 'Upload failed. Could not upload to AmazonS3.'
            }
        }
    }

    async downloadFile(idFile: string): Promise<DownloadSuccess | ServerError> {
        const linkDownload = `https://${this.bucket}.s3.amazonaws.com/${idFile}`

        try {
            const fileBytesS3: Response = await fetch(linkDownload)
            const buffer = await this.convert2buffer(fileBytesS3)
            const fileType = await fileTypeFromBuffer(buffer)
            return {
                buffer: buffer,
                name: idFile,
                mimeType: fileType?.mime!,
            }
        } catch (error) {
            console.log('Download failed. Could not download to AmazonS3.\n', error)
            return {
                status: 500,
                errorMessage: 'Download failed. Could not download to AmazonS3.'
            }
        }
    }

    async convert2buffer(fileBytesOneDrive: Response): Promise<Buffer> {
        const blob = await fileBytesOneDrive.blob()
        const arrayBuffer = await blob.arrayBuffer()
        return await Buffer.from(arrayBuffer)
    }
}

export default AmazonS3Driver
