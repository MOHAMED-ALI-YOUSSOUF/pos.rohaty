'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { HistoryPeriod } from '@/lib/date-range'

export function PeriodFilter({ period, from, to }: { period: HistoryPeriod; from: string; to: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [customFrom, setCustomFrom] = useState(from)
    const [customTo, setCustomTo] = useState(to)

    const navigate = (nextPeriod: HistoryPeriod, nextFrom?: string, nextTo?: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('period', nextPeriod)
        if (nextPeriod === 'custom' && nextFrom && nextTo) {
            params.set('from', nextFrom)
            params.set('to', nextTo)
        } else {
            params.delete('from')
            params.delete('to')
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    return <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <Select value={period} onValueChange={(value) => value && navigate(value as HistoryPeriod, customFrom, customTo)}>
            <SelectTrigger className="w-full sm:w-[190px]"><SelectValue /></SelectTrigger>
            <SelectContent>
                <SelectItem value="today">Aujourd’hui</SelectItem>
                <SelectItem value="custom">Période personnalisée</SelectItem>
            </SelectContent>
        </Select>
        {period === 'custom' && <form className="flex flex-col sm:flex-row gap-2" onSubmit={(event) => { event.preventDefault(); navigate('custom', customFrom, customTo) }}>
            <Input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} required aria-label="Date de début" />
            <Input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} required aria-label="Date de fin" />
            <Button type="submit" variant="outline">Appliquer</Button>
        </form>}
    </div>
}
