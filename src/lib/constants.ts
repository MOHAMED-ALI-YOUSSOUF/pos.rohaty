export const PUBLIC_URL = 'https://pos.rohaty.com'

export const ORDER_STATUS = { OPEN: 'OPEN', SENT_TO_KITCHEN: 'SENT_TO_KITCHEN', PAID: 'PAID', CANCELLED: 'CANCELLED' } as const
export const ORDER_STATUS_LABEL: Record<string, string> = { OPEN: 'Ouverte', SENT_TO_KITCHEN: 'Cuisine', PAID: 'Payée', CANCELLED: 'Annulée' }
export const ORDER_TYPE = { DINE_IN: 'DINE_IN', TAKEAWAY: 'TAKEAWAY' } as const
export const PAYMENT_METHOD = { CASH: 'CASH', DMONEY: 'DMONEY', WAAFI: 'WAAFI', CARD: 'CARD', OTHER: 'OTHER' } as const
export const PAYMENT_METHODS = [
    { id: PAYMENT_METHOD.CASH, label: 'Espèces' }, { id: PAYMENT_METHOD.DMONEY, label: 'D-Money' },
    { id: PAYMENT_METHOD.WAAFI, label: 'Waafi' }, { id: PAYMENT_METHOD.CARD, label: 'Carte' },
    { id: PAYMENT_METHOD.OTHER, label: 'Autre' },
] as const
export const PAYMENT_STATUS = { PENDING: 'PENDING', PAID: 'PAID', FAILED: 'FAILED' } as const
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]
export type OrderType = (typeof ORDER_TYPE)[keyof typeof ORDER_TYPE]
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD]
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]
export const PAYMENT_METHOD_LABEL: Record<string, string> = Object.fromEntries(PAYMENT_METHODS.map(({ id, label }) => [id, label]))
