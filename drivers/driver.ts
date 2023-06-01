interface Driver {
    uploadFile: (fileBytes: any, filename: string) => Promise<any>,
    downloadFile: (idFile: string) => Promise<string | null>,
}
