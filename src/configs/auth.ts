import { env } from "../../env";
export const authConfig = {
    jwt:{
        secret:env.ACCESS_TOKEN_SECRET,
        expiresIn:env.ACCESS_TOKEN_EXPIRES_IN,
        refreshSecret:env.REFRESH_TOKEN_SECRET,
        refreshExpiresIn:env.REFRESH_TOKEN_EXPIRES_IN,
        refreshCookieName:env.REFRESH_TOKEN_COOKIE_NAME
    }
}