type DriverBase = {
    upload_folder: string,
    limit_file_size: string,
    makeAuth: () => Promise<boolean>,
    uploadFile: (file: any, filename: string) => Promise<any>,
}

type FileSystemDriver = DriverBase

export { FileSystemDriver }
