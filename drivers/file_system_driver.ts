import { FileSystemDriver } from "./drivers"
import * as fs from 'fs'

const fileSystemDriveBuilder = (tenantConfig: any): FileSystemDriver => {
    return {
        upload_folder: tenantConfig.properties.upload_folder,
        limit_file_size: tenantConfig.properties.limit_file_size,
        makeAuth: async (): Promise<boolean> => true,
        uploadFile: async (bytes: any, filename: string): Promise<any> => {
            if (!fs.existsSync(tenantConfig.properties.upload_folder)) {
                fs.mkdirSync(tenantConfig.properties.upload_folder)
            }
            fs.writeFile(`${tenantConfig.properties.upload_folder}/${filename}`, bytes, (err) => {
                if (err) {
                    throw new Error(`File cannot be written`)
                }
                else {
                    console.log(`File ${filename} was uploaded successfullly to filesystem.`)
                }
            });

            return {"name": `${filename}`}
        },
    }
}

export default fileSystemDriveBuilder
