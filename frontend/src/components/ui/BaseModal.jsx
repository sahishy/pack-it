import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FaXmark } from 'react-icons/fa6'

const BaseModal = ({ open, onClose, title, children, footer }) => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if(!open) {
            setIsVisible(false)
            return undefined
        }

        const frame = requestAnimationFrame(() => setIsVisible(true))

        const onEscape = (event) => {
            if(event.key === 'Escape') {
                onClose?.()
            }
        }

        document.addEventListener('keydown', onEscape)

        return () => {
            cancelAnimationFrame(frame)
            document.removeEventListener('keydown', onEscape)
        }
    }, [open, onClose])

    if(!open) {
        return null
    }

    return createPortal(
        <div className={`fixed inset-0 z-80 flex items-center justify-center p-4 backdrop-blur-sm transition ${isVisible ? 'bg-neutral0/20' : 'bg-neutral0/0'}`}>
            <button
                type='button'
                aria-label='Close modal'
                className='absolute inset-0 cursor-default'
                onClick={onClose}
            />

            <div className={`relative z-10 w-full max-w-lg rounded-2xl border border-neutral3 bg-neutral5 p-5 shadow-2xl shadow-shadow transition ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <div className='mb-4 flex items-center justify-between'>
                    <h2 className='text-lg font-semibold text-neutral0'>{title}</h2>

                    <button
                        type='button'
                        onClick={onClose}
                        className='rounded-lg p-2 text-neutral1 transition hover:bg-neutral4 hover:text-neutral0'
                        aria-label='Close'
                    >
                        <FaXmark />
                    </button>
                </div>

                <div>{children}</div>

                {footer ? <div className='mt-5'>{footer}</div> : null}
            </div>
        </div>,
        document.body,
    )
}

export default BaseModal
