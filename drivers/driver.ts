interface Driver {
    uploadFile: (fileBytes: any, filename: string) => Promise<any>,
    downloadFile: (idFile: string) => Promise<any>,
}
