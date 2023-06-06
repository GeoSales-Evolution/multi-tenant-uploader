import FileSystemDriver from "./file_system_driver.js"
import OneDriveDriver from "./one_drive_driver.js"

let driver: Driver

function initializeDriver(tenantConfig: TenantConfig): boolean {
    switch (tenantConfig.driver) {
        case "fileSystem":
            driver = new FileSystemDriver(tenantConfig.properties.upload_folder)
            return true
        case "oneDrive":
            driver = new OneDriveDriver(tenantConfig)
            return true
        default:
            return false
    }
}

async function uploadFile(bytes: any, filename: string): Promise<UploadSuccess | ServerError> {
    return await driver.uploadFile(bytes, filename)
}

export { initializeDriver, uploadFile }
