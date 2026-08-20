/**
 * Service d'impression — abstraction multi-resto
 * MVP : redirection vers page ticket (window.print)
 * Plus tard : QZ / PrintNode selon restaurants.print_mode
 */

export type PrintType = 'kitchen' | 'receipt'

export function getPrintPath(type: PrintType, orderId: string) {
  if (type === 'kitchen') return `/print/kitchen/${orderId}`
  return `/print/receipt/${orderId}`
}

/** À appeler après createOrder */
export function printKitchenTicket(orderId: string) {
  return getPrintPath('kitchen', orderId)
}

/** À appeler après payOrder */
export function printCustomerReceipt(orderId: string) {
  return getPrintPath('receipt', orderId)
}