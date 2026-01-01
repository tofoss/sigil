import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface ShoppingListContextValue {
  refreshTrigger: number
  triggerRefresh: () => void
}

const ShoppingListContext = createContext<ShoppingListContextValue | undefined>(undefined)

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <ShoppingListContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </ShoppingListContext.Provider>
  )
}

export function useShoppingListRefresh() {
  const context = useContext(ShoppingListContext)
  if (!context) {
    throw new Error('useShoppingListRefresh must be used within ShoppingListProvider')
  }
  return context
}
