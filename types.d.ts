type TenantConfig = {
    tenant: string,
    driver: string,
    properties: {
        access_token: string | null,
        token_creation_date: string | null,
        token_url: string | null,
        upload_url: string | null,
        download_url: string | null,
        upload_folder: string,
        client_id: string | null,
        client_secret: string | null,
        grant_type: string | null,
        scope: string | null,
    }
}

type Err = {
    status: number
    errorMessage: string
}

type UploadSuccess = {
    cdFile: number,
    obfuscatedLink: string,
    id: string,
    status: number,
    name: string,
    path: string,
    size: string,
    mimeType: string,
}

type DownloadSuccess = {
    id: string,
    status: number,
    msg: string,
    downloadLink: string,
    name: string,
    mimeType: string,
}

type AuthStatus = {
    status: number
}
