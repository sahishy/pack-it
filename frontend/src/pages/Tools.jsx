import { FaCalculator, FaDollarSign, FaPlug, FaScaleBalanced, FaDroplet, FaCircleExclamation } from 'react-icons/fa6'
import Tool from '../components/tools/Tool'

const tools = [
    {
        name: 'Tip Calculator',
        description: 'Calculate tips for different countries',
        path: '/tools/tip-calculator',
        icon: FaCalculator,
    },
    {
        name: 'Currency Converter',
        description: 'Convert currencies with custom rates',
        path: '/tools/currency-converter',
        icon: FaDollarSign,
    },
    {
        name: 'Plug Guide',
        description: 'Find plug types and voltages worldwide',
        path: '/tools/plug-guide',
        icon: FaPlug,
    },
    {
        name: 'Unit Converter',
        description: 'Convert weights, temperatures & distances',
        path: '/tools/unit-converter',
        icon: FaScaleBalanced,
    },
    {
        name: 'Liquid Checker',
        description: 'Check carry-on liquid allowances',
        path: '/tools/liquid-checker',
        icon: FaDroplet,
    },
    {
        name: 'Emergency Info',
        description: 'Store important emergency contacts',
        path: '/tools/emergency-info',
        icon: FaCircleExclamation,
    },
]

const Tools = () => {

    return (
        <main className='mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12'>
            <header className='border-b pb-8'>
                <p className='text-sm text-muted-foreground'>Travel utilities</p>
                <h1 className='mt-1 text-3xl font-semibold tracking-tight'>Tools</h1>
                <p className='mt-2 max-w-xl text-sm text-muted-foreground'>Quick, focused helpers for the details that come up while traveling.</p>
            </header>
            <div className='pt-8'>
                <section className='grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'>
                    {tools.map((tool) => <Tool key={tool.path} tool={tool} />)}
                </section>
            </div>
        </main>
    )

}

export default Tools
