import FileSystemDriver from "./file_system_driver.js"
import OneDriveDriver from "./one_drive_driver.js"

let driver: Driver

function initializeDriver(tenantConfig: any): void {
    switch (tenantConfig.driver) {
        case "fileSystem":
            driver = new FileSystemDriver(tenantConfig.properties.upload_folder)
            break
        case "oneDrive":
            driver = new OneDriveDriver(tenantConfig)
            break
        default:
            throw new Error(`No driver named ${tenantConfig.driver} was found`)
    }
}

async function uploadFile(bytes: any, filename: string): Promise<any> {
    return await driver.uploadFile(bytes, filename)
}

export { initializeDriver, uploadFile }
