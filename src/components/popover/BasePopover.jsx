import { useEffect, useRef, useState } from 'react'

const ALIGN_STYLES = {
    left: 'left-0',
    right: 'right-0',
}

const BasePopover = ({ trigger, children, align = 'right', contentClassName = '', offsetClassName = 'top-[calc(100%+0.5rem)]' }) => {

    const [open, setOpen] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const containerRef = useRef(null)

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false)
            }
        }

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [])

    useEffect(() => {
        if (open) {
            setIsVisible(false)
            const frame = requestAnimationFrame(() => setIsVisible(true))
            return () => cancelAnimationFrame(frame)
        }

        setIsVisible(false)
    }, [open])

    return (
        <div
            ref={containerRef}
            className="relative [&_button]:cursor-pointer [&_a]:cursor-pointer **:[[role='button']]:cursor-pointer"
        >
            {trigger({
                open,
                toggle: () => setOpen((prev) => !prev),
                close: () => setOpen(false),
            })}

            {open ? (
                <div
                    className={`absolute z-50 origin-top-right transition ease-out ${offsetClassName} ${ALIGN_STYLES[align] ?? ALIGN_STYLES.right} ${isVisible ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-1 scale-95 opacity-0'} ${contentClassName}`}
                >
                    {children({ close: () => setOpen(false) })}
                </div>
            ) : null}
        </div>

    )

}

export default BasePopover