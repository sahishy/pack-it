import { createContext, useContext, useMemo } from 'react'
import useTripItems from '../hooks/useTripItems'

const ItemsContext = createContext()

const ItemsProvider = ({ children }) => {
    const value = useMemo(() => ({}), [])

    return (
        <ItemsContext.Provider value={value}>
            {children}
        </ItemsContext.Provider>
    )
}

const useItems = () => useContext(ItemsContext)

export {
    ItemsProvider,
    useItems,
    useTripItems,
}
