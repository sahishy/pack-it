import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const CommandPalette = ({
    open,
    onClose,
    query,
    onQueryChange,
    items = [],
    onSelect,
    getItemId = (item) => item.id,
    getItemLabel = (item) => item.name,
    getItemThumbnail = (item) => item.logo,
    title = 'Select an option',
    placeholder = 'Search...',
    emptyMessage = 'No results found.',
}) => {
    const inputRef = useRef(null)
    const [isVisible, setIsVisible] = useState(false)

    const firstItem = useMemo(() => items[0] ?? null, [items])

    useEffect(() => {
        if (!open) {
            setIsVisible(false)
            return undefined
        }

        const frame = requestAnimationFrame(() => {
            setIsVisible(true)
            inputRef.current?.focus()
        })

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose?.()
            }

            if (event.key === 'Enter' && firstItem) {
                onSelect?.(firstItem)
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            cancelAnimationFrame(frame)
        }
    }, [open, onClose, onSelect, firstItem])

    if (!open) {
        return null
    }

    return createPortal(
        <div className={`fixed inset-0 z-60 flex items-start justify-center p-4 pt-[10vh] backdrop-blur-sm transition ${isVisible ? 'bg-neutral0/10' : 'bg-neutral0/0'}`}>
            <button
                type='button'
                aria-label='Close command palette'
                className='absolute inset-0 cursor-default'
                onClick={onClose}
            />

            <div className={`relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral3 bg-neutral5 shadow-2xl shadow-shadow transition ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <div className='border-b border-neutral3 px-4 py-3'>
                    <p className='text-sm font-semibold text-neutral0'>{title}</p>

                    <input
                        ref={inputRef}
                        type='text'
                        value={query}
                        onChange={(event) => onQueryChange?.(event.target.value)}
                        placeholder={placeholder}
                        className='mt-3 w-full rounded-xl border border-neutral2 bg-neutral5 px-3 py-2.5 text-sm text-neutral0 outline-none transition placeholder:text-neutral1 focus:border-neutral1 focus:ring-2 focus:ring-neutral3'
                    />
                </div>

                <ul className='max-h-[50vh] overflow-auto p-2'>
                    {items.length === 0 ? (
                        <li className='rounded-lg px-3 py-2 text-sm text-neutral1'>
                            {emptyMessage}
                        </li>
                    ) : (
                        items.map((item) => {
                            const label = getItemLabel(item)
                            const thumbnail = getItemThumbnail(item)

                            return (
                                <li key={getItemId(item)}>
                                    <button
                                        type='button'
                                        className='flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-neutral4'
                                        onClick={() => onSelect?.(item)}
                                    >
                                        {thumbnail ? (
                                            <img
                                                src={thumbnail}
                                                alt={`${label} logo`}
                                                className='h-7 w-7 shrink-0 rounded-md object-cover'
                                            />
                                        ) : (
                                            <div className='h-7 w-7 shrink-0 rounded-md bg-neutral4' aria-hidden='true' />
                                        )}

                                        <span className='text-sm text-neutral0'>{label}</span>
                                    </button>
                                </li>
                            )
                        })
                    )}
                </ul>
            </div>
        </div>,
        document.body,
    )
}

export default CommandPalette