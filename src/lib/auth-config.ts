export const AUTH_COOKIE_NAME = 'ssi_session'
export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 12
export const DEFAULT_FIRM_NAME = 'Space Shastra Interiors'
export const DEFAULT_FIRM_SLUG = 'space-shastra'
export const DEFAULT_ADMIN_USERNAME = 'admin'

export const getAuthSecret = () => process.env.AUTH_SECRET || ''
export const getAdminPassword = () => process.env.ADMIN_PASSWORD || ''
export const getDefaultFirmName = () => process.env.DEFAULT_FIRM_NAME || DEFAULT_FIRM_NAME
export const getDefaultFirmSlug = () => process.env.DEFAULT_FIRM_SLUG || DEFAULT_FIRM_SLUG
export const getAdminUsername = () => process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME
