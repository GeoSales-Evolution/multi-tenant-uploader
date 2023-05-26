import Driver from './drivers.js'
import fileSystemDriveBuilder from './file_system_driver.js'
import oneDriveBuilder from './one_drive_driver.js'

let driver: Driver

function initializeDriver(tenantConfig: any): void {
    switch (tenantConfig.driver) {
        case "fileSystem":
            driver = fileSystemDriveBuilder(tenantConfig)
            break
        case "oneDrive":
            driver = oneDriveBuilder(tenantConfig)
            break
        default:
            throw new Error(`No driver named ${tenantConfig.driver} was found`)
    }
}

async function uploadFile(bytes: any, filename: string): Promise<any> {
    const authenticated = await driver.makeAuth()
    if (!authenticated) {
        "generateToken" in driver && await driver.generateToken()
    }
    return await driver.uploadFile(bytes, filename)
}

export { initializeDriver, uploadFile }
