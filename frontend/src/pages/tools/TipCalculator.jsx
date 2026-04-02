import { useMemo, useState } from 'react'
import { FaDollarSign, FaGlobe, FaUsers } from 'react-icons/fa6'
import Card from '../../components/ui/Card'
import Return from '../../components/ui/Return'
import Input from '../../components/ui/Input'
import Slider from '../../components/ui/Slider'
import Counter from '../../components/popover/Counter'
import CommandPalette from '../../components/ui/CommandPalette'
import {
    calculateTipSummary,
    getDefaultTipPercent,
    getTipCountries,
    getTipRange,
} from '../../services/tools/tipCalculatorService'

const TIP_PERCENT_PRESETS = [10, 15, 20, 25]
const SPLIT_PRESETS = [1, 2, 3, 4]

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    }).format(value)
}

const TipCalculator = () => {
    const countries = useMemo(() => getTipCountries(), [])
    const defaultCountry = useMemo(
        () => countries.find((country) => country.country === 'United States') ?? countries[0] ?? null,
        [countries],
    )

    const [selectedCountry, setSelectedCountry] = useState(defaultCountry)
    const [countryQuery, setCountryQuery] = useState('')
    const [isCountryPaletteOpen, setIsCountryPaletteOpen] = useState(false)
    const [billAmount, setBillAmount] = useState('')
    const [tipPercent, setTipPercent] = useState(() => getDefaultTipPercent(defaultCountry?.country))
    const [splitBetween, setSplitBetween] = useState(1)

    const filteredCountries = useMemo(() => {
        const normalizedQuery = countryQuery.trim().toLowerCase()

        if (!normalizedQuery) {
            return countries
        }

        return countries.filter((country) => country.country.toLowerCase().includes(normalizedQuery))
    }, [countries, countryQuery])

    const tipRange = useMemo(() => getTipRange(selectedCountry?.country), [selectedCountry])

    const summary = useMemo(
        () => calculateTipSummary({ billAmount, tipPercent, splitBetween }),
        [billAmount, splitBetween, tipPercent],
    )

    return (
        <main className='min-h-screen bg-neutral5'>
            <div className='mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-10'>
                <Return link='/tools' text='Back to Tools' />

                <div className='mb-2'>
                    <h1 className='text-4xl font-bold text-neutral0'>Tip Calculator</h1>
                    <p className='mt-1 text-sm text-neutral1'>Calculate tips by country and split the bill with ease.</p>
                </div>

                <Card className='flex flex-col gap-3'>
                    <h2 className='text-sm font-medium text-neutral0'>Country</h2>

                    <button
                        type='button'
                        onClick={() => {
                            setCountryQuery(selectedCountry?.country ?? '')
                            setIsCountryPaletteOpen(true)
                        }}
                        className='flex min-h-10.5 w-full items-center gap-3 rounded-xl border border-neutral2 bg-neutral5 px-3 py-2 text-left text-sm text-neutral0 outline-none transition focus:border-neutral1 focus:ring-2 focus:ring-neutral3'
                    >
                        <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral4 text-neutral1'>
                            <FaGlobe />
                        </div>

                        <span className={selectedCountry?.country ? 'text-neutral0' : 'text-neutral1'}>
                            {selectedCountry?.country ?? 'Select a country'}
                        </span>
                    </button>

                    {tipRange.hasNumericRange ? (
                        <p className='text-xs text-neutral1'>
                            Typical tip range: {tipRange.min}% - {tipRange.max}%
                        </p>
                    ) : tipRange.other ? (
                        <p className='text-xs text-neutral1'>{tipRange.other}</p>
                    ) : null}
                </Card>

                <Card>
                    <h2 className='text-sm font-medium text-neutral0'>Bill Amount</h2>

                    <div className='relative mt-1'>
                        <span className='pointer-events-none absolute inset-y-0 left-5 flex items-center text-2xl text-neutral1'>
                            <FaDollarSign />
                        </span>

                        <Input
                            id='billAmount'
                            type='number'
                            inputMode='decimal'
                            min='0'
                            step='0.01'
                            value={billAmount}
                            onChange={(event) => setBillAmount(event.target.value)}
                            placeholder='0.00'
                            className='no-spinner py-4 pl-14 pr-14 text-center text-4xl! leading-none! font-semibold!'
                        />
                    </div>
                </Card>

                <Card className='flex flex-col gap-3'>
                    <h2 className='text-sm font-medium text-neutral0'>Tip Percentage</h2>

                    <Slider
                        id='tipPercent'
                        value={tipPercent}
                        min={0}
                        max={30}
                        step={1}
                        valueLabel={`${tipPercent}%`}
                        leftHint={`${tipRange.min}%`}
                        rightHint={`${tipRange.max}%`}
                        onChange={setTipPercent}
                    />

                    <div className='flex flex-wrap gap-2'>
                        {TIP_PERCENT_PRESETS.map((preset) => {
                            const isActive = tipPercent === preset

                            return (
                                <button
                                    key={preset}
                                    type='button'
                                    onClick={() => setTipPercent(preset)}
                                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${isActive
                                        ? 'border-primary0 bg-primary0 text-white'
                                        : 'border-neutral2 bg-neutral5 text-neutral1 hover:border-neutral1 hover:text-neutral0'
                                    }`}
                                >
                                    {preset}%
                                </button>
                            )
                        })}
                    </div>
                </Card>

                <Card className='flex flex-col gap-3'>
                    <h2 className='text-sm font-medium text-neutral0'>Split Between</h2>

                    <div className='relative'>
                        <span className='pointer-events-none absolute inset-y-0 left-5 z-10 flex items-center text-2xl text-neutral1'>
                            <FaUsers />
                        </span>

                        <Counter
                            id='splitBetween'
                            value={splitBetween}
                            onChange={setSplitBetween}
                            min={1}
                            className='justify-center! py-4! pl-14! pr-14! text-center text-4xl! leading-none! font-semibold!'
                        />
                    </div>

                    <div className='flex flex-wrap gap-2'>
                        {SPLIT_PRESETS.map((preset) => {
                            const isActive = splitBetween === preset

                            return (
                                <button
                                    key={preset}
                                    type='button'
                                    onClick={() => setSplitBetween(preset)}
                                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${isActive
                                        ? 'border-primary0 bg-primary0 text-white'
                                        : 'border-neutral2 bg-neutral5 text-neutral1 hover:border-neutral1 hover:text-neutral0'
                                    }`}
                                >
                                    {preset}
                                </button>
                            )
                        })}
                    </div>
                </Card>

                <Card className='border-none bg-linear-to-r from-[#4f85f6] to-[#22c2e8] text-white'>
                    <div className='flex flex-col gap-2 text-sm'>
                        <div className='flex items-center justify-between'>
                            <span className='text-white/80'>Bill Amount</span>
                            <span className='font-medium text-white'>{formatCurrency(summary.billAmount)}</span>
                        </div>

                        <div className='flex items-center justify-between'>
                            <span className='text-white/80'>Tip Amount ({summary.tipPercent}%)</span>
                            <span className='font-medium text-white'>{formatCurrency(summary.tipAmount)}</span>
                        </div>

                        <hr className='border-white/20 my-2'/>

                        <div className='flex items-center justify-between'>
                            <span className='font-medium text-white'>Total</span>
                            <span className={`${summary.splitBetween > 1 ? '' : 'text-2xl'} font-semibold text-white`}>
                                {formatCurrency(summary.totalAmount)}
                            </span>
                        </div>

                        {summary.splitBetween > 1 ? (
                            <div className='flex items-center justify-between'>
                                <span className='text-white/80'>Per Person ({summary.splitBetween})</span>
                                <span className='text-2xl font-medium text-white'>{formatCurrency(summary.perPersonAmount)}</span>
                            </div>
                        ) : null}
                    </div>
                </Card>
            </div>

            <CommandPalette
                open={isCountryPaletteOpen}
                onClose={() => setIsCountryPaletteOpen(false)}
                query={countryQuery}
                onQueryChange={setCountryQuery}
                items={filteredCountries}
                title='Select country'
                placeholder='Search countries'
                emptyMessage='No countries found.'
                getItemId={(item) => item.country}
                getItemLabel={(item) => item.country}
                getItemDescription={(item) => {
                    if(item.tip_low !== 0 && item.tip_high !== 0) {
                        return `${item.tip_low}% - ${item.tip_high}% Standard`
                    }

                    return item.other ?? null
                }}
                getItemThumbnail={() => (
                    <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral4 text-neutral1'>
                        <FaGlobe />
                    </div>
                )}
                onSelect={(country) => {
                    setSelectedCountry(country)
                    setTipPercent(getDefaultTipPercent(country.country))
                    setIsCountryPaletteOpen(false)
                    setCountryQuery('')
                }}
            />
        </main>
    )
}

export default TipCalculator