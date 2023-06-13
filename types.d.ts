type TenantConfig = {
    tenant: string,
    driver: string | null,
    properties: {
        upload_folder: string
    } | null
}

type OneDriveConfig = TenantConfig & {
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

type FileMetadata = {
    tenant: string,
    driver: string,
    id_file_driver: string,
    name: string,
    path: string,
    size: number,
    mime_type: string,
    creation_date: Date,
}

type ServerError = {
    status: number,
    errorMessage: string,
}

type UploadSuccess = {
    id: string,
    status: number,
    msg: string,
    createdDateTime: string,
    name: string,
    path: string,
    size: number,
    mimeType: string,
}

type AuthStatus = {
    status: number,
}
