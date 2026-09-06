export type HistoryPeriod = 'today' | 'custom'

export function getHistoryRange(
    periodValue?: string | string[],
    fromValue?: string | string[],
    toValue?: string | string[]
) {
    const requestedPeriod = firstValue(periodValue)
    const period: HistoryPeriod =
        ['today', 'custom'].includes(requestedPeriod || '')
            ? (requestedPeriod as HistoryPeriod)
            : 'today'

    const now = new Date()
    let from = new Date(now)
    let to = new Date(now)

    if (period === 'custom') {
        const customFrom = parseLocalDate(firstValue(fromValue))
        const customTo = parseLocalDate(firstValue(toValue))

        if (customFrom) from = customFrom
        if (customTo) to = customTo
    }

    if (from > to) {
        ;[from, to] = [to, from]
    }

    from.setHours(0, 0, 0, 0)
    to.setHours(23, 59, 59, 999)

    return {
        period,
        from,
        to,
        fromDate: formatDateInput(from),
        toDate: formatDateInput(to),
    }
}

function firstValue(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value
}

function parseLocalDate(value?: string) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

    const date = new Date(`${value}T00:00:00`)
    return Number.isNaN(date.getTime()) ? null : date
}

function formatDateInput(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}
