export const AUTH_COOKIE_NAME = 'ssi_session'
export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 12

export const getAuthSecret = () => process.env.AUTH_SECRET || ''
export const getAdminPassword = () => process.env.ADMIN_PASSWORD || ''
