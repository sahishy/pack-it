import { useMemo, useState } from 'react'
import {
    FaArrowRightArrowLeft,
    FaRulerHorizontal,
    FaScaleBalanced,
    FaTemperatureHigh,
} from 'react-icons/fa6'
import { Card } from '@/components/ui/card'
import Return from '@/components/common/Return'
import Input from '@/components/common/FormInput'
import { Button } from '@/components/ui/button'
import Select from '@/components/common/FormSelect'
import TabSelector from '@/components/common/TabSelector'
import ToolPageHeader from '@/components/tools/ToolPageHeader'
import {
    convertUnits,
    getDefaultUnitsForCategory,
    getUnitOptionsByCategory,
} from '../../services/tools/unitConverterService'

const TAB_OPTIONS = [
    {
        value: 'temperature',
        component: (
            <span className='inline-flex items-center justify-center gap-1.5'>
                <FaTemperatureHigh className='text-sm' />
                <span>
                    <span className='sm:hidden'>Temp</span>
                    <span className='hidden sm:inline'>Temperature</span>
                </span>
            </span>
        ),
    },
    {
        value: 'weight',
        component: (
            <span className='inline-flex items-center justify-center gap-1.5'>
                <FaScaleBalanced className='text-sm' />
                <span>Weight</span>
            </span>
        ),
    },
    {
        value: 'distance',
        component: (
            <span className='inline-flex items-center justify-center gap-1.5'>
                <FaRulerHorizontal className='text-sm' />
                <span>Distance</span>
            </span>
        ),
    },
]

const formatConvertedValue = (value) => {
    if (!Number.isFinite(value)) {
        return '0'
    }

    return value.toFixed(5).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

const normalizeFiveDecimals = (value) => {
    const numericValue = Number(value)

    if (!Number.isFinite(numericValue)) {
        return '0'
    }

    return numericValue.toFixed(5).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

const UnitConverter = () => {
    const [activeTab, setActiveTab] = useState('temperature')
    const [fromAmount, setFromAmount] = useState('1')

    const defaultUnits = useMemo(() => getDefaultUnitsForCategory(activeTab), [activeTab])
    const [fromUnit, setFromUnit] = useState(defaultUnits.fromUnit)
    const [toUnit, setToUnit] = useState(defaultUnits.toUnit)

    const unitOptions = useMemo(() => getUnitOptionsByCategory(activeTab), [activeTab])

    const convertedValue = useMemo(() => {
        return convertUnits({
            amount: fromAmount,
            category: activeTab,
            fromUnit,
            toUnit,
        })
    }, [activeTab, fromAmount, fromUnit, toUnit])

    const handleTabChange = (nextTab) => {
        setActiveTab(nextTab)

        const defaults = getDefaultUnitsForCategory(nextTab)
        setFromUnit(defaults.fromUnit)
        setToUnit(defaults.toUnit)
    }

    const handleSwap = () => {
        const nextFromAmount = convertedValue

        setFromUnit(toUnit)
        setToUnit(fromUnit)
        setFromAmount(normalizeFiveDecimals(nextFromAmount))
    }

    return (
        <main className='min-h-screen bg-neutral5'>
            <div className='mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-10'>
                <Return link='/tools' text='Back to Tools' />

                <ToolPageHeader
                    title='Unit Converter'
                    description='Convert temperature, weight, and distance instantly.'
                    icon={FaScaleBalanced}
                    color='#ff7a1a'
                />

                <TabSelector
                    tabs={TAB_OPTIONS}
                    value={activeTab}
                    onChange={handleTabChange}
                    fromColor='#ff7a1a'
                    toColor='#ff4a3d'
                />

                <Card className='grid gap-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-4'>
                    <section className='flex min-w-0 flex-col gap-3'>
                        <h2 className='text-sm font-medium text-neutral0'>From</h2>

                        <Select
                            id='fromUnit'
                            value={fromUnit}
                            onChange={setFromUnit}
                            options={unitOptions}
                            placeholder='Select unit'
                            className='mt-0'
                        />

                        <Input
                            id='fromAmount'
                            type='number'
                            inputMode='decimal'
                            value={fromAmount}
                            onChange={(event) => setFromAmount(event.target.value)}
                            onBlur={() => setFromAmount(normalizeFiveDecimals(fromAmount))}
                            placeholder='0'
                            className='h-14 text-center text-2xl! font-semibold! tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none'
                        />
                    </section>

                    <section className='flex items-center justify-center md:self-center'>
                        <Button
                            type='button'
                            onClick={handleSwap}
                            variant='secondary'
                            className='flex gap-3 md:size-10 md:rounded-full md:p-0'
                            aria-label='Swap currencies'
                        >
                            <FaArrowRightArrowLeft className='text-sm' />
                            <span className='md:hidden'>Swap Units</span>
                        </Button>
                    </section>

                    <section className='flex min-w-0 flex-col gap-3'>
                        <h2 className='text-sm font-medium text-neutral0'>To</h2>

                        <Select
                            id='toUnit'
                            value={toUnit}
                            onChange={setToUnit}
                            options={unitOptions}
                            placeholder='Select unit'
                            className='mt-0'
                        />

                        <Input
                            id='convertedAmount'
                            type='text'
                            value={formatConvertedValue(convertedValue)}
                            readOnly
                            className='h-14 border-none! bg-linear-to-r from-[#ff7a1a] to-[#ff4a3d] text-center text-2xl! font-semibold! text-white! tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none'
                        />
                    </section>
                </Card>
            </div>
        </main>
    )
}

export default UnitConverter
