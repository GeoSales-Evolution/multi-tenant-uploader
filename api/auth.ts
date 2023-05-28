import { config as dotenvConfig } from "dotenv-safe"

dotenvConfig()

const authUrl = process.env.URL_AUTH_SERVICE;

const authenticate = async (authParams: URLSearchParams): Promise<any> => {
    return (await fetch(`${authUrl}?${authParams}`))
}

export default authenticate
