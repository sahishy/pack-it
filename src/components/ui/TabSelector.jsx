const TabSelector = ({
    tabs = [],
    value,
    onChange,
    className = '',
    fromColor = 'var(--color-primary0)',
    toColor = 'var(--color-primary1)',
}) => {
    const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.value === value))
    const tabCount = tabs.length || 1
    const gapRem = 0.5
    const totalGapRem = Math.max(0, tabCount - 1) * gapRem

    return (
        <div
            className={`relative grid gap-2 rounded-full border border-neutral2 bg-neutral5 p-1 ${className}`}
            style={{ gridTemplateColumns: `repeat(${tabs.length || 1}, minmax(0, 1fr))` }}
        >
            <div className='pointer-events-none absolute inset-1 z-0'>
                <div
                    className='absolute top-0 bottom-0 rounded-full bg-linear-to-r from-primary0 to-primary1 transition-transform duration-300 ease-out'
                    style={{
                        width: `calc((100% - ${totalGapRem}rem) / ${tabCount})`,
                        transform: `translateX(calc(${activeIndex} * (100% + ${gapRem}rem)))`,
                        backgroundImage: `linear-gradient(to right, ${fromColor}, ${toColor})`,
                    }}
                />
            </div>

            {tabs.map((tab) => {
                const isActive = tab.value === value

                return (
                    <button
                        key={tab.value}
                        type='button'
                        onClick={() => onChange?.(tab.value)}
                        className={`relative z-10 rounded-full px-3 py-2 text-sm font-medium transition cursor-pointer ${isActive
                            ? 'text-neutral5'
                            : 'text-neutral1 hover:text-neutral0'
                        }`}
                    >
                        {tab.component}
                    </button>
                )
            })}
        </div>
    )
}

export default TabSelector