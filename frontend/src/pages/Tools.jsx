import { FaCalculator, FaDollarSign, FaPlug, FaScaleBalanced, FaDroplet, FaCircleExclamation, FaWrench } from 'react-icons/fa6'
import Tool from '../components/tools/Tool'

const tools = [
    {
        name: 'Tip Calculator',
        description: 'Calculate tips for different countries',
        path: '/tools/tip-calculator',
        icon: FaCalculator,
        from: '#4f85f6',
        to: '#22c2e8',
    },
    {
        name: 'Currency Converter',
        description: 'Convert currencies with custom rates',
        path: '/tools/currency-converter',
        icon: FaDollarSign,
        from: '#2bc96b',
        to: '#1fb38e',
    },
    {
        name: 'Plug Guide',
        description: 'Find plug types and voltages worldwide',
        path: '/tools/plug-guide',
        icon: FaPlug,
        from: '#8d5cf6',
        to: '#e64aab',
    },
    {
        name: 'Unit Converter',
        description: 'Convert weights, temperatures & distances',
        path: '/tools/unit-converter',
        icon: FaScaleBalanced,
        from: '#ff7a1a',
        to: '#ff4a3d',
    },
    {
        name: 'Liquid Checker',
        description: 'Check carry-on liquid allowances',
        path: '/tools/liquid-checker',
        icon: FaDroplet,
        from: '#20b9d8',
        to: '#3a7df7',
    },
    {
        name: 'Emergency Info',
        description: 'Store important emergency contacts',
        path: '/tools/emergency-info',
        icon: FaCircleExclamation,
        from: '#ff5f4a',
        to: '#ff8a00',
    },
]

const Tools = () => {

    return (
        <main className='min-h-screen bg-neutral5'>
            <section className='w-full bg-none from-primary0 to-primary1 lg:bg-linear-to-r'>
                <div className='m-6 flex max-w-4xl flex-col gap-6 px-6 py-10 rounded-xl bg-linear-to-r from-primary0 to-primary1 lg:m-auto lg:bg-none'>
                    <div className='flex flex-col gap-2 items-center lg:items-start'>
                        <h2 className='flex gap-2 items-center text-sm text-white/80'><FaWrench className='text-lg'/>No Wi-Fi? No problem.</h2>
                        <h1 className='text-4xl lg:text-5xl font-bold text-white'>Travel Tools</h1>
                        <p className='text-white/80'>Helpful offline utilities for your journey</p>
                    </div>
                </div>
            </section>

            <div className='mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-4 lg:py-10'>
                <section className='grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-2'>
                    {tools.map((tool) => <Tool key={tool.path} tool={tool} />)}
                </section>
            </div>
        </main>
    )

}

export default Tools