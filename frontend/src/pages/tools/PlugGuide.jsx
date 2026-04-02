import { useMemo, useState } from 'react'
import { FaBoltLightning, FaPlug, FaWaveSquare } from 'react-icons/fa6'
import Card from '../../components/ui/Card'
import Return from '../../components/ui/Return'
import CommandPalette from '../../components/ui/CommandPalette'
import { getPlugCountries, searchPlugCountries } from '../../services/tools/plugGuideService'

import TypeAPlugImage from '../../assets/images/plugs/typeA.jpg'
import TypeBPlugImage from '../../assets/images/plugs/typeB.jpg'
import TypeCPlugImage from '../../assets/images/plugs/typeC.jpg'
import TypeDPlugImage from '../../assets/images/plugs/typeD.jpg'
import TypeEPlugImage from '../../assets/images/plugs/typeE.jpg'
import TypeFPlugImage from '../../assets/images/plugs/typeF.jpg'
import TypeGPlugImage from '../../assets/images/plugs/typeG.jpg'
import TypeHPlugImage from '../../assets/images/plugs/typeH.jpg'
import TypeIPlugImage from '../../assets/images/plugs/typeI.jpg'
import TypeJPlugImage from '../../assets/images/plugs/typeJ.jpg'
import TypeKPlugImage from '../../assets/images/plugs/typeK.jpg'
import TypeLPlugImage from '../../assets/images/plugs/typeL.jpg'
import TypeMPlugImage from '../../assets/images/plugs/typeM.jpg'
import TypeNPlugImage from '../../assets/images/plugs/typeN.jpg'
import TypeOPlugImage from '../../assets/images/plugs/typeO.jpg'

const PLUG_TYPE_DETAILS = {
    A: {
        image: TypeAPlugImage,
        description: 'It has two flat parallel pins.',
    },
    B: {
        image: TypeBPlugImage,
        description: 'It has two flat parallel pins with a grounding pin.',
    },
    C: {
        image: TypeCPlugImage,
        description: 'It has two round pins.',
    },
    D: {
        image: TypeDPlugImage,
        description: 'It has three round pins in a triangular pattern.',
    },
    E: {
        image: TypeEPlugImage,
        description: 'It has two round pins and a hole for the socket grounding pin.',
    },
    F: {
        image: TypeFPlugImage,
        description: 'It has two round pins with grounding clips on the sides.',
    },
    G: {
        image: TypeGPlugImage,
        description: 'It has three rectangular pins in a triangular pattern.',
    },
    H: {
        image: TypeHPlugImage,
        description: 'It has three pins in a Y-shaped arrangement.',
    },
    I: {
        image: TypeIPlugImage,
        description: 'It has two or three flat pins set at an angle.',
    },
    J: {
        image: TypeJPlugImage,
        description: 'It has three round pins with the grounding pin centered.',
    },
    K: {
        image: TypeKPlugImage,
        description: 'It has two round pins and a grounding hole on the face.',
    },
    L: {
        image: TypeLPlugImage,
        description: 'It has three round pins in a straight line.',
    },
    M: {
        image: TypeMPlugImage,
        description: 'It has three large round pins in a triangular pattern.',
    },
    N: {
        image: TypeNPlugImage,
        description: 'It has three round pins, with two angled and one grounding pin.',
    },
    O: {
        image: TypeOPlugImage,
        description: 'It has three round pins in a triangular pattern used in Thailand.',
    },
}

const getPlugTypeDescription = (plugType) => {
    return PLUG_TYPE_DETAILS[plugType]?.description ?? 'No description available for this plug type.'
}

const getPlugTypeImage = (plugType) => {
    return PLUG_TYPE_DETAILS[plugType]?.image ?? null
}

const formatUnitList = (values, unit) => {
    if (!values?.length) {
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
                                            className='flex items-center gap-6!'
                                        >
                                            {getPlugTypeImage(plugType) ? (
                                                <img
                                                    src={getPlugTypeImage(plugType)}
                                                    alt={`Type ${plugType} plug`}
                                                    className='h-16 w-16 rounded-lg object-cover'
                                                />
                                            ) : (
                                                <div className='flex h-16 w-16 items-center justify-center rounded-lg bg-neutral4 p-3 font-medium text-neutral1'>
                                                    {plugType}
                                                </div>
                                            )}
                                            <div>
                                                <h1 className='font-medium'>
                                                    Type {plugType}
                                                </h1>
                                                <p className='text-sm text-neutral1'>
                                                    {getPlugTypeDescription(plugType)}
                                                </p>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className='mb-2 text-sm font-medium text-neutral0'>Voltage & Frequency</p>
                                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                                    <Card className='rounded-xl border border-neutral3 bg-neutral4/50 p-4'>
                                        <p className='flex gap-1 items-center text-xs uppercase text-neutral1'><FaBoltLightning /> Voltage</p>
                                        <p className='mt-1 text-lg font-semibold text-neutral0'>
                                            {formatUnitList(selectedCountry.voltage, 'V')}
                                        </p>
                                    </Card>

                                    <Card className='rounded-xl border border-neutral3 bg-neutral4/50 p-4'>
                                        <p className='flex gap-1 items-center text-xs uppercase text-neutral1'><FaWaveSquare /> Frequency</p>
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