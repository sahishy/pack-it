import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const VIEWPORT_PADDING = 8
const POPOVER_GAP = 8
const POPOVER_MAX_WIDTH = 1152

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const BasePopover = ({ trigger, children, contentClassName = '' }) => {

    const [open, setOpen] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [placement, setPlacement] = useState('bottom')
    const [popoverStyle, setPopoverStyle] = useState({})

    const triggerRef = useRef(null)
    const popoverRef = useRef(null)

    useEffect(() => {
        const handleOutsideClick = (event) => {
            const clickInsideTrigger = triggerRef.current?.contains(event.target)
            const clickInsidePopover = popoverRef.current?.contains(event.target)

            if (!clickInsideTrigger && !clickInsidePopover) {
                setOpen(false)
            }
        }

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)
        document.addEventListener('touchstart', handleOutsideClick)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
            document.removeEventListener('touchstart', handleOutsideClick)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [])

    useEffect(() => {
        if (!open) {
            setIsVisible(false)
            return undefined
        }

        const frame = requestAnimationFrame(() => setIsVisible(true))
        return () => cancelAnimationFrame(frame)
    }, [open])

    useEffect(() => {
        if (!open) {
            return undefined
        }

        const updatePosition = () => {
            const triggerEl = triggerRef.current
            const popoverEl = popoverRef.current

            if (!triggerEl || !popoverEl) {
                return
            }

            const triggerRect = triggerEl.getBoundingClientRect()
            const popoverRect = popoverEl.getBoundingClientRect()

            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight
            const availableWidth = Math.max(0, viewportWidth - VIEWPORT_PADDING * 2)
            const fitRegionWidth = Math.min(POPOVER_MAX_WIDTH, availableWidth)
            const fitRegionLeft = (viewportWidth - fitRegionWidth) / 2
            const fitRegionRight = fitRegionLeft + fitRegionWidth
            const boundedPopoverWidth = Math.min(
                popoverRect.width,
                POPOVER_MAX_WIDTH,
                availableWidth,
            )

            const spaceBelow = viewportHeight - triggerRect.bottom - VIEWPORT_PADDING
            const spaceAbove = triggerRect.top - VIEWPORT_PADDING

            const shouldPlaceBelow =
                spaceBelow >= popoverRect.height ||
                (spaceBelow >= spaceAbove)

            const nextPlacement = shouldPlaceBelow ? 'bottom' : 'top'

            const rawY = shouldPlaceBelow
                ? triggerRect.bottom + POPOVER_GAP
                : triggerRect.top - popoverRect.height - POPOVER_GAP

            const startX = triggerRect.left
            const endX = triggerRect.right - boundedPopoverWidth

            const getHorizontalOverflow = (xValue) => {
                const leftOverflow = Math.max(0, fitRegionLeft - xValue)
                const rightOverflow = Math.max(0, xValue + boundedPopoverWidth - fitRegionRight)
                return leftOverflow + rightOverflow
            }

            const rawX = getHorizontalOverflow(startX) <= getHorizontalOverflow(endX)
                ? startX
                : endX

            const maxX = Math.max(
                fitRegionLeft,
                fitRegionRight - boundedPopoverWidth,
            )

            const maxY = Math.max(
                VIEWPORT_PADDING,
                viewportHeight - popoverRect.height - VIEWPORT_PADDING,
            )

            const nextX = clamp(
                rawX,
                fitRegionLeft,
                maxX,
            )

            const nextY = clamp(
                rawY,
                VIEWPORT_PADDING,
                maxY,
            )

            setPlacement(nextPlacement)
            setPosition({ x: nextX, y: nextY })
            setPopoverStyle({
                '--popover-trigger-width': `${Math.min(triggerRect.width, viewportWidth - VIEWPORT_PADDING * 2)}px`,
                maxWidth: `min(${POPOVER_MAX_WIDTH}px, calc(100vw - ${VIEWPORT_PADDING * 2}px))`,
                maxHeight: `calc(100vh - ${VIEWPORT_PADDING * 2}px)`,
            })
        }

        const scheduleUpdate = () => {
            requestAnimationFrame(updatePosition)
        }

        scheduleUpdate()

        window.addEventListener('resize', scheduleUpdate)
        window.addEventListener('scroll', scheduleUpdate, true)

        const resizeObserver = new ResizeObserver(scheduleUpdate)
        if (triggerRef.current) {
            resizeObserver.observe(triggerRef.current)
        }
        if (popoverRef.current) {
            resizeObserver.observe(popoverRef.current)
        }

        return () => {
            window.removeEventListener('resize', scheduleUpdate)
            window.removeEventListener('scroll', scheduleUpdate, true)
            resizeObserver.disconnect()
        }
    }, [open])

    return (
        <>
            <div
                ref={triggerRef}
                className="relative [&_button]:cursor-pointer [&_a]:cursor-pointer **:[[role='button']]:cursor-pointer"
            >
                {trigger({
                    open,
                    toggle: () => setOpen((prev) => !prev),
                    close: () => setOpen(false),
                })}
            </div>

            {open
                ? createPortal(
                    <div
                        ref={popoverRef}
                        data-placement={placement}
                        style={{
                            position: 'fixed',
                            left: `${position.x}px`,
                            top: `${position.y}px`,
                            transformOrigin: placement === 'top' ? 'bottom center' : 'top center',
                            ...popoverStyle,
                        }}
                        className={`z-50 transition duration-150 ease-out ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} ${contentClassName}`}
                    >
                        {children({ close: () => setOpen(false) })}
                    </div>,
                    document.body,
                )
                : null}
        </>

    )

}

export default BasePopover