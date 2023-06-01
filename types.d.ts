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

type UploadError = {
    status: number
    error: string
}

type UploadSuccess = {
    id: string
    status: number
    msg: string
    createdDateTime: string
    name: string
    path: string
    size: number
    mimeType: string
}

type AuthStatus = {
    status: number
}

type AuthError = {
    status: number,
    errorMessage: string
}