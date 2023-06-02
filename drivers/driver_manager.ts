import FileSystemDriver from "./file_system_driver.js"
import OneDriveDriver from "./one_drive_driver.js"

let driver: Driver

async function uploadFile(tenantConfig: any, fileBytes: any, filename: string): Promise<any> {
    switch (tenantConfig.driver) {
        case "fileSystem":
            driver = new FileSystemDriver(tenantConfig.properties.upload_folder)
            return await driver.uploadFile(fileBytes, filename)
        case "oneDrive":
            driver = new OneDriveDriver(tenantConfig)
            return await driver.uploadFile(fileBytes, filename)
        default:
            throw new Error(`No driver named ${tenantConfig.driver} was found`)
    }
}

export default uploadFile
