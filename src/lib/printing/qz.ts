'use client'

import { PAYMENT_METHOD_LABEL } from '@/lib/constants'
import type { PaymentMethod } from '@/lib/constants'

export interface ThermalItem { name: string; quantity: number; unitPrice?: number; total?: number; note?: string | null }
export interface KitchenTicketData { restaurantName: string; orderNumber: number; tableLabel: string; createdAt?: string; note?: string | null; items: ThermalItem[] }
export interface ReceiptTicketData extends KitchenTicketData { currency: string; subtotal: number; discount: number; total: number; paymentMethod: PaymentMethod; receivedAmount: number; changeAmount: number }

let connectionPromise: Promise<typeof import('qz-tray')> | null = null

async function loadQz() {
    if (typeof window === 'undefined') throw new Error('QZ Tray est disponible uniquement dans le navigateur')
    return (await import('qz-tray')).default
}

export async function connectQz() {
    const qz = await loadQz()
    if (qz.websocket.isActive()) return qz
    if (!connectionPromise) {
        connectionPromise = qz.websocket.connect({ retries: 1, delay: 1 }).then(() => qz).catch((error: unknown) => {
            connectionPromise = null
            throw new Error(error instanceof Error ? `QZ Tray non disponible : ${error.message}` : 'QZ Tray non disponible')
        })
    }
    return connectionPromise
}

export async function getPrinters() {
    const qz = await connectQz()
    const printers = await qz.printers.find()
    return Array.isArray(printers) ? printers : [printers]
}

export async function printKitchenTicket(printerName: string | null | undefined, ticket: KitchenTicketData) {
    if (!printerName) throw new Error('Imprimante cuisine non configurée')
    return printRaw(printerName, buildKitchenTicket(ticket))
}

export async function printReceipt(printerName: string | null | undefined, ticket: ReceiptTicketData) {
    if (!printerName) throw new Error('Imprimante reçu non configurée')
    return printRaw(printerName, buildReceipt(ticket))
}

export async function printTest(printerName: string) {
    return printRaw(printerName, `${center('QRMENU-POS')}\n${center('Test impression')}\n${center('Imprimante OK')}\n\n\n`)
}

async function printRaw(printerName: string, content: string) {
    const qz = await connectQz()
    const printer = await qz.printers.find(printerName)
    if (Array.isArray(printer) ? !printer.includes(printerName) : printer !== printerName) throw new Error(`Imprimante introuvable : ${printerName}`)
    const config = qz.configs.create(printerName, { encoding: 'UTF-8' })
    await qz.print(config, ['\x1B\x40', content, '\n\n\n', '\x1D\x56\x00'])
}

const WIDTH = 42
const divider = '-'.repeat(WIDTH)
const clean = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '')
const center = (value: string) => clean(value).slice(0, WIDTH).padStart(Math.floor((WIDTH + clean(value).slice(0, WIDTH).length) / 2)).padEnd(WIDTH)
const money = (value: number, currency: string) => `${Math.round(value).toLocaleString('fr-FR')} ${currency}`
const line = (left: string, right: string) => { const r = clean(right); return `${clean(left).slice(0, Math.max(1, WIDTH - r.length - 1)).padEnd(WIDTH - r.length)}${r}` }
const ticketDate = (createdAt?: string) => new Date(createdAt || Date.now())

function commonHeader(ticket: KitchenTicketData, title: string) {
    const date = ticketDate(ticket.createdAt)
    return [center(ticket.restaurantName.toUpperCase()), center(title), divider, line(`#${ticket.orderNumber} ${clean(ticket.tableLabel).toUpperCase()}`, date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })), date.toLocaleDateString('fr-FR'), divider]
}

function buildKitchenTicket(ticket: KitchenTicketData) {
    const rows = ticket.items.flatMap(item => [`${item.quantity}x ${clean(item.name).toUpperCase()}`, ...(item.note ? [`  NOTE: ${clean(item.note)}`] : [])])
    if (ticket.note) rows.push(divider, `NOTE COMMANDE: ${clean(ticket.note).toUpperCase()}`)
    return [...commonHeader(ticket, 'TICKET CUISINE'), ...rows, divider, center('FIN DU TICKET')].join('\n')
}

function buildReceipt(ticket: ReceiptTicketData) {
    const rows = ticket.items.flatMap(item => [line(`${item.quantity}x ${item.name}`, money(Number(item.total ?? item.quantity * Number(item.unitPrice || 0)), ticket.currency)), ...(item.note ? [`  ${clean(item.note)}`] : [])])
    const totals = ticket.discount > 0 ? [line('Sous-total', money(ticket.subtotal, ticket.currency)), line('Remise', `-${money(ticket.discount, ticket.currency)}`)] : []
    return [...commonHeader(ticket, 'TICKET CLIENT'), ...rows, divider, ...totals, line('TOTAL', money(ticket.total, ticket.currency)), divider, line('Paiement', PAYMENT_METHOD_LABEL[ticket.paymentMethod] || ticket.paymentMethod), ...(ticket.paymentMethod === 'CASH' ? [line('Recu', money(ticket.receivedAmount, ticket.currency)), line('Rendu', money(ticket.changeAmount, ticket.currency))] : []), divider, center('Merci et a bientot !')].join('\n')
}
