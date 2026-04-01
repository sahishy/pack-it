import { useMemo, useState } from 'react'
import { FaCheck, FaDroplet, FaXmark } from 'react-icons/fa6'
import { FiCheckCircle, FiXCircle } from 'react-icons/fi'
import Card from '../../components/ui/Card'
import Return from '../../components/ui/Return'
import Input from '../../components/ui/Input'
import Select from '../../components/popover/Select'
import {
    CARRY_ON_LIMIT_ML,
    getAllowanceStatus,
    getCommonLiquids,
    isItemAllowed,
} from '../../services/tools/liquidCheckerService'
import { FaCheckCircle } from 'react-icons/fa'

const UNIT_OPTIONS = [
    { value: 'milliliters', label: 'Milliliters', alias: 'ml' },
    { value: 'ounces', label: 'Ounces', alias: 'oz' },
]

const LiquidChecker = () => {
    const [containerValue, setContainerValue] = useState('')
    const [containerUnit, setContainerUnit] = useState('milliliters')

    const commonItems = useMemo(() => getCommonLiquids(), [])
    const allowanceStatus = useMemo(
        () => getAllowanceStatus(containerValue, containerUnit),
        [containerUnit, containerValue],
    )

    return (
        <main className='min-h-screen bg-neutral5'>
            <div className='mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-10'>
                <Return link='/tools' text='Back to Tools' />

                <div className='mb-2'>
                    <h1 className='text-4xl font-bold text-neutral0'>Liquid Checker</h1>
                    <p className='mt-1 text-sm text-neutral1'>Check if your liquid containers are carry-on compliant.</p>
                </div>

                <Card className='border-none bg-linear-to-r from-[#20b9d8] to-[#3a7df7]'>
                    <div className='flex items-start gap-4'>
                        <div className='pt-1'>
                            <FaDroplet className='text-2xl text-white' />
                        </div>

                        <div className='flex flex-col gap-2'>
                            <h2 className='text-xl font-semibold text-white'>The 3-1-1 Rule</h2>
                            <p className='text-sm leading-relaxed text-white/80'>
                                3 ounces (100ml) or less per container
                                <br />
                                1 quart-size clear plastic bag
                                <br />
                                1 bag per passenger
                                <br />
                                <br />
                                Applies to: liquids, gels, aerosols, creams, and pastes
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className='flex flex-col gap-4'>
                    <h2 className='text-sm font-medium text-neutral0'>Container Size</h2>

                    <div className='grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px] md:items-end'>
                        <Input
                            id='containerSize'
                            type='number'
                            inputMode='decimal'
                            min='0'
                            step='0.01'
                            value={containerValue}
                            onChange={(event) => setContainerValue(event.target.value)}
                            placeholder='0.00'
                            className='no-spinner py-4 text-center text-4xl! leading-none! font-semibold!'
                        />

                        <Select
                            id='containerUnit'
                            value={containerUnit}
                            onChange={setContainerUnit}
                            options={UNIT_OPTIONS}
                            className='mt-0'
                        />
                    </div>

                    {allowanceStatus ? (
                        <div
                            className={`flex items-center gap-4 rounded-xl border p-4 ${allowanceStatus.allowed
                                ? 'border-positive1/30 bg-positive1/10'
                                : 'border-negative1/30 bg-negative1/10'
                            }`}
                        >
                            {allowanceStatus.allowed ? (
                                <FiCheckCircle className='text-4xl text-positive1' />
                            ) : (
                                <FiXCircle className='text-4xl text-negative1' />
                            )}

                            <div className='flex flex-col gap-1'>
                                <p className={`text-xl font-semibold ${allowanceStatus.allowed ? 'text-positive0' : 'text-negative0'}`}>
                                    {allowanceStatus.title}
                                </p>
                                <p className={`text-sm ${allowanceStatus.allowed ? 'text-positive1' : 'text-negative1'}`}>
                                    {allowanceStatus.message} {!allowanceStatus.allowed && `The carry-on threshold is ${CARRY_ON_LIMIT_ML} ml.`}
                                </p>
                            </div>
                        </div>
                    ) : null}
                </Card>

                <Card className='flex flex-col gap-3'>
                    <h2 className='text-sm font-medium text-neutral0'>Common Items</h2>

                    <div className='flex flex-col gap-2'>
                        {commonItems.map((item) => {
                            const allowed = isItemAllowed(item.volumeMl)

                            return (
                                <Card
                                    key={item.item}
                                    className='flex items-center justify-between p-4!'
                                >
                                    <div className='flex flex-col gap-0.5'>
                                        <p className='text-sm font-medium text-neutral0'>{item.item}</p>
                                        <p className='text-xs text-neutral1'>{item.volumeMl} ml</p>
                                    </div>

                                    <div
                                        className={`items-center justify-center rounded-full ${allowed ? 'text-positive1' : 'text-negative1'}`}
                                        aria-label={allowed ? 'Allowed' : 'Not allowed'}
                                    >
                                        {allowed ? <FaCheck className='text-lg' /> : <FaXmark className='text-lg' />}
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                </Card>
            </div>
        </main>
    )
}

export default LiquidChecker