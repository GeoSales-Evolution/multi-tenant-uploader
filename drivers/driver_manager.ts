import { FileSystemDriver, OneDriveDriver } from './drivers.js'
import fileSystemDriveBuilder from './file_system_driver.js'
import oneDriveBuilder from './one_drive_driver.js'

async function uploadFile(tenantConfig: any, bytes: any, filename: string): Promise<any> {
    switch (tenantConfig.driver) {
        case "fileSystem":
            const fsDriver: FileSystemDriver = fileSystemDriveBuilder(tenantConfig)
            return await fsDriver.uploadFile(bytes, filename)
        case "oneDrive":
            const oneDriveDriver: OneDriveDriver = oneDriveBuilder(tenantConfig)
            const authenticated = await oneDriveDriver.makeAuth()
            if (!authenticated) {
                const accessToken = await oneDriveDriver.generateToken()
                tenantConfig.properties.access_token = accessToken
            }
            return await oneDriveDriver.uploadFile(bytes, filename)
        default:
            throw new Error(`No driver named ${tenantConfig.driver} was found`)
    }
}

export default uploadFile
