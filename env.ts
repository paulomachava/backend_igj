
import {z} from "zod"

const envSchema = z.object({
    DATABASE_URL:z.string().url(),
    ACCESS_TOKEN_SECRET:z.string(),
    ACCESS_TOKEN_EXPIRES_IN:z.string(),
    REFRESH_TOKEN_SECRET:z.string(),
    REFRESH_TOKEN_EXPIRES_IN:z.string(),
    REFRESH_TOKEN_COOKIE_NAME:z.string(),
})

export const env = envSchema.parse(process.env)