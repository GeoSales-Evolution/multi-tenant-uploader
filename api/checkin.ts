import { config as dotenvConfig } from "dotenv-safe"
import { getTenantConfig } from '../db/db.js'
import { initializeDriver } from '../drivers/driver_manager.js'

dotenvConfig()
const authUrl = process.env.URL_AUTH_SERVICE;

async function checkinDefault(authHeader: string, tenant: string): Promise<Err | null> {
    if (!authHeader) {
        return {
            status: 401,
            errorMessage: 'Missing Authorization header'
        }
    }

    const token = authHeader?.split(' ')[1]
    if (!token) {
        return {
            status: 401,
            errorMessage: 'Missing bearer token'
        }
    }

    const authParams = new URLSearchParams({
        token: token,
        tenant: tenant
    });

    const authResponse = await makeAuth(authUrl, authParams)

    if (authResponse.status !== 200) {
        return {
            status: 401,
            errorMessage: 'Error trying authentication'
        }
    }

    const tenantConfig = await getTenantConfig(tenant)

    if (!tenantConfig) {
        return {
            status: 404,
            errorMessage: 'Tenant not found'
        }
    }

    if (!initializeDriver(tenantConfig)) {
        return {
            status: 404,
            errorMessage: 'Driver not found'
        }
    }
    return null
}

async function makeAuth(authUrl: string | undefined, authParams: URLSearchParams): Promise<AuthStatus | Err> {
    try {
      const response = await fetch(`${authUrl}?${authParams}`);
        return {status: response.status};
    } catch (error: any) {
        return {
            status: 500,
            errorMessage: error
        }
    }
}

export default checkinDefault
