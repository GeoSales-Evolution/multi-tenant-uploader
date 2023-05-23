import { FileSystemDriver } from './drivers.js'
import fileSystemDriveBuilder from './file_system_driver.js'

async function uploadFile(tenantConfig: any, bytes: any, filename: string): Promise<any> {
    switch (tenantConfig.driver) {
        case "fileSystem":
            const fsDriver: FileSystemDriver = fileSystemDriveBuilder(tenantConfig)
            return await fsDriver.uploadFile(bytes, filename)
        default:
            throw new Error(`No driver named ${tenantConfig.driver} was found`)
    }
}

export default uploadFile
