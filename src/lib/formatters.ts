export function formatPrice(value: number, currency = 'FDJ'): string {
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value))} ${currency}`
}
