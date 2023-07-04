import AmazonS3Driver from "./amazon_s3_driver.js"
import FileSystemDriver from "./file_system_driver.js"
import OneDriveDriver from "./one_drive_driver.js"

let driver: Driver

function initializeDriver(tenantConfig: TenantConfig): boolean {
    switch (tenantConfig.driver) {
        case "file_system":
            driver = new FileSystemDriver(tenantConfig.properties!.upload_folder)
            return true
        case "one_drive":
            driver = new OneDriveDriver(tenantConfig as OneDriveConfig)
            return true
        case "amazon_s3":
            driver = new AmazonS3Driver(tenantConfig as AmazonS3Config)
            return true
        default:
            return false
    }
}

async function uploadFile(bytes: any, filename: string): Promise<UploadSuccess | ServerError> {
    return await driver.uploadFile(bytes, filename)
}

async function downloadFile(idFile: string): Promise<DownloadSuccess | ServerError> {
    return await driver.downloadFile(idFile)
}

export { initializeDriver, uploadFile, downloadFile }
