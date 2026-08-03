import * as React from 'react'
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts'

import { cn } from '@/lib/utils'

const ChartContext = React.createContext(null)

function ChartContainer({ className, config, children, ...props }) {
    return (
        <ChartContext.Provider value={{ config }}>
            <div
                data-slot='chart'
                className={cn('flex aspect-square justify-center text-xs [&_.recharts-sector]:outline-none', className)}
                {...props}
            >
                <ResponsiveContainer>{children}</ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    )
}

function RadialProgress({ value = 0, label = 'Progress', className, ...props }) {
    const progress = Math.min(Math.max(value, 0), 100)
    const chartConfig = { progress: { label, color: 'var(--color-neutral1)' } }

    return (
        <ChartContainer
            config={chartConfig}
            role='img'
            aria-label={`${label}: ${Math.round(progress)}%`}
            className={cn('size-10 shrink-0', className)}
            {...props}
        >
            <RadialBarChart data={[{ progress }]} startAngle={90} endAngle={-270} innerRadius='54%' outerRadius='100%' barSize={5}>
                <PolarAngleAxis type='number' dataKey='progress' domain={[0, 100]} tick={false} axisLine={false} />
                <RadialBar dataKey='progress' background={{ fill: 'var(--color-neutral3)' }} fill='var(--color-neutral1)' cornerRadius={4} />
            </RadialBarChart>
        </ChartContainer>
    )
}

export { ChartContainer, RadialProgress }
