import { useMemo, useState } from 'react'
import { FaArrowRightArrowLeft, FaCircleInfo, FaDollarSign } from 'react-icons/fa6'
import { Card } from '@/components/ui/card'
import Return from '@/components/common/Return'
import Input from '@/components/common/FormInput'
import { Button } from '@/components/ui/button'
import CommandPalette from '@/components/common/CommandPalette'
import ToolPageHeader from '@/components/tools/ToolPageHeader'
import {
    convertCurrencyAmount,
    getCurrencies,
    getDefaultCurrencyPair,
} from '../../services/tools/currencyConverterService'

const formatAmount = (value) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)
}

const CurrencyConverter = () => {
    const currencies = useMemo(() => getCurrencies(), [])
    const defaultPair = useMemo(() => getDefaultCurrencyPair(), [])

    const [fromCurrency, setFromCurrency] = useState(defaultPair.fromCurrency)
    const [toCurrency, setToCurrency] = useState(defaultPair.toCurrency)
    const [fromAmount, setFromAmount] = useState('1')

    const [isFromPaletteOpen, setIsFromPaletteOpen] = useState(false)
    const [isToPaletteOpen, setIsToPaletteOpen] = useState(false)
    const [fromQuery, setFromQuery] = useState('')
    const [toQuery, setToQuery] = useState('')

    const filteredFromCurrencies = useMemo(() => {
        const normalizedQuery = fromQuery.trim().toLowerCase()

        if (!normalizedQuery) {
            return currencies
        }

        return currencies.filter((currency) => {
            const label = `${currency.country} ${currency.currencyName}`.toLowerCase()
            return label.includes(normalizedQuery)
        })
    }, [currencies, fromQuery])

    const filteredToCurrencies = useMemo(() => {
        const normalizedQuery = toQuery.trim().toLowerCase()

        if (!normalizedQuery) {
            return currencies
        }

        return currencies.filter((currency) => {
            const label = `${currency.country} ${currency.currencyName}`.toLowerCase()
            return label.includes(normalizedQuery)
        })
    }, [currencies, toQuery])

    const conversion = useMemo(() => {
        return convertCurrencyAmount({
            amount: fromAmount,
            fromCurrency,
            toCurrency,
        })
    }, [fromAmount, fromCurrency, toCurrency])

    const swapCurrencies = () => {
        const nextFromAmount = conversion.convertedAmount

        setFromCurrency(toCurrency)
        setToCurrency(fromCurrency)
        setFromAmount(String(nextFromAmount))
    }

    return (
        <main className='min-h-screen bg-neutral5'>
            <div className='mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-10'>
                <Return link='/tools' text='Back to Tools' />

                <ToolPageHeader
                    title='Currency Converter'
                    description='Convert values across world currencies with local exchange-rate data.'
                    icon={FaDollarSign}
                    color='#2bc96b'
                />

                <Card className='border-none bg-linear-to-r from-[#2bc96b] to-[#1fb38e] text-white'>
                    <div className='flex items-start gap-4'>
                        <div className='pt-1'>
                            <FaDollarSign className='text-2xl text-white' />
                        </div>

                        <div className='flex flex-col gap-2'>
                            <h2 className='text-xl font-semibold text-white'>Rate Notice</h2>
                            <p className='text-sm leading-relaxed text-white/80'>
                                This converter works fully offline using bundled exchange-rate data. Rates were last updated on 12/31/25 and may differ from live market values.
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className='grid gap-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-4'>
                    <section className='flex min-w-0 flex-col gap-3'>
                        <h2 className='text-sm font-medium text-neutral0'>From</h2>

                        <button
                            type='button'
                            onClick={() => {
                                setFromQuery(fromCurrency?.country ?? '')
                                setIsFromPaletteOpen(true)
                            }}
                            className='flex min-h-10.5 w-full items-center gap-3 rounded-xl border border-neutral2 bg-neutral5 px-3 py-2 text-left text-sm text-neutral0 outline-none transition focus:border-neutral1 focus:ring-2 focus:ring-neutral3'
                        >
                            <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral4 text-sm font-semibold text-neutral1'>
                                {fromCurrency?.symbol ?? '$'}
                            </div>

                            <span className='flex min-w-0 flex-col gap-0.5'>
                                <span className='truncate text-sm text-neutral0'>
                                    {fromCurrency ? `${fromCurrency.country} - ${fromCurrency.currencyName}` : 'Select a currency'}
                                </span>
                                {fromCurrency ? (
                                    <span className='truncate text-xs text-neutral1'>1 USD = {fromCurrency.exchangeRate} {fromCurrency.currencyName}</span>
                                ) : null}
                            </span>
                        </button>

                        <div className='relative'>
                            <span className='pointer-events-none absolute inset-y-0 left-5 flex items-center text-xl font-semibold text-neutral1'>
                                {fromCurrency?.symbol ?? '$'}
                            </span>

                            <Input
                                id='fromAmount'
                                type='number'
                                inputMode='decimal'
                                min='0'
                                step='0.01'
                                value={fromAmount}
                                onChange={(event) => setFromAmount(event.target.value)}
                                placeholder='0.00'
                                className='h-14 pr-14 pl-14 text-center text-2xl! font-semibold! tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none'
                            />
                        </div>
                    </section>

                    <section className='flex items-center justify-center md:self-center'>
                        <Button
                            type='button'
                            onClick={swapCurrencies}
                            variant='secondary'
                            className='flex gap-3 md:size-10 md:rounded-full md:p-0'
                            aria-label='Swap currencies'
                        >
                            <FaArrowRightArrowLeft className='text-sm' />
                            <span className='md:hidden'>Swap Currencies</span>
                        </Button>
                    </section>

                    <section className='flex min-w-0 flex-col gap-3'>
                        <h2 className='text-sm font-medium text-neutral0'>To</h2>

                        <button
                            type='button'
                            onClick={() => {
                                setToQuery(toCurrency?.country ?? '')
                                setIsToPaletteOpen(true)
                            }}
                            className='flex min-h-10.5 w-full items-center gap-3 rounded-xl border border-neutral2 bg-neutral5 px-3 py-2 text-left text-sm text-neutral0 outline-none transition focus:border-neutral1 focus:ring-2 focus:ring-neutral3'
                        >
                            <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral4 text-sm font-semibold text-neutral1'>
                                {toCurrency?.symbol ?? '$'}
                            </div>

                            <span className='flex min-w-0 flex-col gap-0.5'>
                                <span className='truncate text-sm text-neutral0'>
                                    {toCurrency ? `${toCurrency.country} - ${toCurrency.currencyName}` : 'Select a currency'}
                                </span>
                                {toCurrency ? (
                                    <span className='truncate text-xs text-neutral1'>1 USD = {toCurrency.exchangeRate} {toCurrency.currencyName}</span>
                                ) : null}
                            </span>
                        </button>

                        <div className='relative'>
                            <span className='pointer-events-none absolute inset-y-0 left-5 flex items-center text-xl font-semibold text-white'>
                                {toCurrency?.symbol ?? '$'}
                            </span>

                            <Input
                                id='toAmount'
                                type='text'
                                value={formatAmount(conversion.convertedAmount)}
                                readOnly
                                className='h-14 border-none! bg-linear-to-r from-[#2bc96b] to-[#1fb38e] pr-14 pl-14 text-center text-2xl! font-semibold! text-white! tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none'
                            />
                        </div>
                    </section>
                </Card>
            </div>

            <CommandPalette
                open={isFromPaletteOpen}
                onClose={() => setIsFromPaletteOpen(false)}
                query={fromQuery}
                onQueryChange={setFromQuery}
                items={filteredFromCurrencies}
                title='Select source currency'
                placeholder='Search by country or currency'
                emptyMessage='No currencies found.'
                getItemId={(item) => item.id}
                getItemLabel={(item) => `${item.country} - ${item.currencyName}`}
                getItemDescription={(item) => `1 USD = ${item.exchangeRate} ${item.currencyName}`}
                getItemThumbnail={(item) => (
                    <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral4 text-sm font-semibold text-neutral1'>
                        {item.symbol}
                    </div>
                )}
                onSelect={(item) => {
                    setFromCurrency(item)
                    setIsFromPaletteOpen(false)
                    setFromQuery('')
                }}
            />

            <CommandPalette
                open={isToPaletteOpen}
                onClose={() => setIsToPaletteOpen(false)}
                query={toQuery}
                onQueryChange={setToQuery}
                items={filteredToCurrencies}
                title='Select target currency'
                placeholder='Search by country or currency'
                emptyMessage='No currencies found.'
                getItemId={(item) => item.id}
                getItemLabel={(item) => `${item.country} - ${item.currencyName}`}
                getItemDescription={(item) => `1 USD = ${item.exchangeRate} ${item.currencyName}`}
                getItemThumbnail={(item) => (
                    <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral4 text-sm font-semibold text-neutral1'>
                        {item.symbol}
                    </div>
                )}
                onSelect={(item) => {
                    setToCurrency(item)
                    setIsToPaletteOpen(false)
                    setToQuery('')
                }}
            />
        </main>
    )
}

export default CurrencyConverter
