import { create } from 'zustand'

export type OrderItem = {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  note?: string
}

type OrderType = 'DINE_IN' | 'TAKEAWAY'

type OrderState = {
  orderType: OrderType
  tableId: string | null
  tableName: string | null
  items: OrderItem[]
  note: string

  setOrderType: (type: OrderType) => void
  setTable: (id: string | null, name: string | null) => void
  addItem: (item: Omit<OrderItem, 'quantity'>) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  setItemNote: (productId: string, note: string) => void
  setNote: (note: string) => void
  clearOrder: () => void
  getSubtotal: () => number
  getTotal: () => number
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orderType: 'DINE_IN',
  tableId: null,
  tableName: null,
  items: [],
  note: '',

  setOrderType: (type) => set({ orderType: type, tableId: null, tableName: null }),

  setTable: (id, name) =>
    set({
      tableId: id,
      tableName: name,
      // Seulement DINE_IN si une vraie table est choisie
      ...(id ? { orderType: 'DINE_IN' as const } : {}),
    }),

  addItem: (item) => {
    const existing = get().items.find((i) => i.productId === item.productId)
    if (existing) {
      set({
        items: get().items.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      })
    } else {
      set({ items: [...get().items, { ...item, quantity: 1 }] })
    }
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      set({ items: get().items.filter((i) => i.productId !== productId) })
    } else {
      set({
        items: get().items.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        ),
      })
    }
  },

  removeItem: (productId) =>
    set({ items: get().items.filter((i) => i.productId !== productId) }),

  setItemNote: (productId, note) =>
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, note } : i
      ),
    }),

  setNote: (note) => set({ note }),

  clearOrder: () =>
    set({
      orderType: 'DINE_IN',
      tableId: null,
      tableName: null,
      items: [],
      note: '',
    }),

  getSubtotal: () =>
    get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

  getTotal: () => get().getSubtotal(),
}))