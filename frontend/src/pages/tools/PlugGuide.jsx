import { useMemo, useState } from 'react'
import { FaBoltLightning, FaPlug, FaWaveSquare } from 'react-icons/fa6'
import Card from '../../components/ui/Card'
import Return from '../../components/ui/Return'
import CommandPalette from '../../components/ui/CommandPalette'
import { getPlugCountries, searchPlugCountries } from '../../services/tools/plugGuideService'

const getPlugTypeDescription = (plugType) => {
    switch(plugType) {
        case 'A':
            return 'It has two flat parallel pins.'
        case 'B':
            return 'It has two flat parallel pins with a grounding pin.'
        case 'C':
            return 'It has two round pins.'
        case 'D':
            return 'It has three large round pins in a triangular pattern.'
        case 'E':
            return 'It has two round pins and a hole for the grounding pin.'
        case 'F':
            return 'It has two round pins and a hole for the grounding pin.'
        default:
            return 'No description available for this plug type.'
    }
}

const formatUnitList = (values, unit) => {
    if(!values?.length) {
        return 'N/A'
    }

    return values.map((value) => `${value} ${unit}`).join(' / ')
}

const PlugGuide = () => {
    const countries = useMemo(() => getPlugCountries(), [])

    const [selectedCountry, setSelectedCountry] = useState(null)
    const [countryQuery, setCountryQuery] = useState('')
    const [isCountryPaletteOpen, setIsCountryPaletteOpen] = useState(false)

    const filteredCountries = useMemo(() => searchPlugCountries(countryQuery), [countryQuery])

    return (
        <main className='min-h-screen bg-neutral5'>
            <div className='mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-10'>
                <Return link='/tools' text='Back to Tools' />

                <div className='mb-2'>
                    <h1 className='text-4xl font-bold text-neutral0'>Plug Guide</h1>
                    <p className='mt-1 text-sm text-neutral1'>Check plug types, voltage, and frequency for any destination.</p>
                </div>

                <Card className='border-none bg-linear-to-r from-[#8d5cf6] to-[#e64aab]'>
                    <div className='flex items-start gap-4'>
                        <div className='pt-1'>
                            <FaBoltLightning className='text-2xl text-white' />
                        </div>

                        <div className='flex flex-col gap-2'>
                            <h2 className='text-xl font-semibold text-white'>Travel Adapter Tip</h2>
                            <p className='text-sm leading-relaxed text-white/80'>
                                Consider getting a universal travel adapter that works in multiple countries. Always check if your devices support dual voltage (110-240V).
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className='flex flex-col gap-3'>
                    <h2 className='text-sm font-medium text-neutral0'>Viewing Country</h2>

                    <button
                        type='button'
                        onClick={() => {
                            setCountryQuery(selectedCountry?.country ?? '')
                            setIsCountryPaletteOpen(true)
                        }}
                        className='flex min-h-10.5 w-full items-center gap-3 rounded-xl border border-neutral2 bg-neutral5 px-3 py-2 text-left text-sm text-neutral0 outline-none transition focus:border-neutral1 focus:ring-2 focus:ring-neutral3'
                    >
                        <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral4 text-neutral1'>
                            <FaPlug />
                        </div>

                        <span className={selectedCountry?.country ? 'text-neutral0' : 'text-neutral1'}>
                            {selectedCountry?.country ?? 'Select a country'}
                        </span>
                    </button>
                </Card>

                <Card className='flex flex-col gap-4'>
                    {!selectedCountry ? (
                        <div className='rounded-xl border border-dashed border-neutral3 bg-neutral4/40 p-6 text-center'>
                            <p className='text-sm text-neutral1'>Select a country to view plug types, voltage, and frequency.</p>
                        </div>
                    ) : (
                        <>
                            <div className='flex flex-col gap-1'>
                                <p className='text-sm text-neutral1'>Currently viewing</p>
                                <h2 className='text-2xl font-semibold text-neutral0'>{selectedCountry.country}</h2>
                            </div>

                            <div>
                                <p className='mb-2 text-sm font-medium text-neutral0'>Plug Types</p>
                                <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                                    {selectedCountry.plugTypes.map((plugType) => (
                                        <Card
                                            key={plugType}
                                            className='flex flex-col gap-3!'
                                        >
                                            <div className='flex items-center gap-3'>
                                                <div className='flex items-center justify-center text-neutral1 bg-neutral4 rounded-lg p-3 font-medium w-8 h-8'>
                                                    {plugType}
                                                </div>
                                                <h1 className='font-medium'>
                                                    Type {plugType}
                                                </h1>
                                            </div>
                                            <p className='text-sm text-neutral1'>
                                                {getPlugTypeDescription(plugType)}
                                            </p>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className='mb-2 text-sm font-medium text-neutral0'>Voltage & Frequency</p>
                                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                                    <Card className='rounded-xl border border-neutral3 bg-neutral4/50 p-4'>
                                        <p className='flex gap-1 items-center text-xs uppercase text-neutral1'><FaBoltLightning/> Voltage</p>
                                        <p className='mt-1 text-lg font-semibold text-neutral0'>
                                            {formatUnitList(selectedCountry.voltage, 'V')}
                                        </p>
                                    </Card>

                                    <Card className='rounded-xl border border-neutral3 bg-neutral4/50 p-4'>
                                        <p className='flex gap-1 items-center text-xs uppercase text-neutral1'><FaWaveSquare/> Frequency</p>
                                        <p className='mt-1 text-lg font-semibold text-neutral0'>
                                            {formatUnitList(selectedCountry.frequency, 'Hz')}
                                        </p>
                                    </Card>
                                </div>                            
                            </div>

                        </>
                    )}
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
                getItemDescription={(item) => `Types: ${item.plugTypes.join(', ')}`}
                getItemThumbnail={() => (
                    <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral4 text-neutral1'>
                        <FaPlug />
                    </div>
                )}
                onSelect={(country) => {
                    setSelectedCountry(country)
                    setIsCountryPaletteOpen(false)
                    setCountryQuery('')
                }}
            />
        </main>
    )
}

export default PlugGuide