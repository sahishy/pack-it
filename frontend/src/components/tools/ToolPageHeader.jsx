import { createElement } from 'react'

const ToolPageHeader = ({ title, description, icon, color }) => (
    <header className='mb-2 flex items-center gap-4'>
        <div className='flex size-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5'>
            {createElement(icon, { className: 'text-xl', style: { color } })}
        </div>
        <div className='min-w-0'>
            <h1 className='text-2xl font-semibold tracking-tight text-neutral0 sm:text-3xl'>{title}</h1>
            <p className='mt-0.5 text-sm leading-relaxed text-neutral1'>{description}</p>
        </div>
    </header>
)

export default ToolPageHeader
