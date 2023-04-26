interface DriverBase {
    info1: string,
    info2: string,
    makeAuth: (arg0: string) => boolean
    accessAPI: (arg0: string) => string
}

type GoogleDriveDriver = {
    particularInfoGD: string
}

type AmazonS3Driver = {
    particularInfoS3: string
}

type DropBoxDriver = {
    particularInfoDB: string
}

type Driver = DriverBase & (GoogleDriveDriver | AmazonS3Driver | DropBoxDriver)

export { Driver }
