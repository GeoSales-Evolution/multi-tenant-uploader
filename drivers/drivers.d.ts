type DriverBase = {
    upload_folder: string,
    limit_file_size: string,
    makeAuth: () => Promise<boolean>,
    uploadFile: (file: any, filename: string) => Promise<any>,
}

type FileSystemDriver = DriverBase

type OneDriveDriver = DriverBase & {
    access_token: string,
    token_url: string,
    upload_url: string,
    client_id: string,
    client_secret: string,
    grant_type: string,
    scope: string,
    generateToken: () => Promise<string>
}

export { FileSystemDriver, OneDriveDriver }
