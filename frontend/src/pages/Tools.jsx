import { FaCalculator, FaDollarSign, FaPlug, FaScaleBalanced, FaDroplet, FaCircleExclamation } from 'react-icons/fa6'
import Tool from '../components/tools/Tool'

const tools = [
    {
        name: 'Tip Calculator',
        description: 'Calculate tips for different countries',
        path: '/tools/tip-calculator',
        icon: FaCalculator,
        colors: ['#4f85f6', '#22c2e8'],
    },
    {
        name: 'Currency Converter',
        description: 'Convert currencies with custom rates',
        path: '/tools/currency-converter',
        icon: FaDollarSign,
        colors: ['#2bc96b', '#1fb38e'],
    },
    {
        name: 'Plug Guide',
        description: 'Find plug types and voltages worldwide',
        path: '/tools/plug-guide',
        icon: FaPlug,
        colors: ['#8d5cf6', '#e64aab'],
    },
    {
        name: 'Unit Converter',
        description: 'Convert weights, temperatures & distances',
        path: '/tools/unit-converter',
        icon: FaScaleBalanced,
        colors: ['#ff7a1a', '#ff4a3d'],
    },
    {
        name: 'Liquid Checker',
        description: 'Check carry-on liquid allowances',
        path: '/tools/liquid-checker',
        icon: FaDroplet,
        colors: ['#20b9d8', '#3a7df7'],
    },
    {
        name: 'Emergency Info',
        description: 'Store important emergency contacts',
        path: '/tools/emergency-info',
        icon: FaCircleExclamation,
        colors: ['#ff5f4a', '#ff8a00'],
    },
]

const Tools = () => {

    return (
        <main className='mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 lg:py-12'>
            <header>
                <h1 className='text-xl font-medium tracking-tight'>Tools</h1>
                <p className='mt-1 text-sm text-muted-foreground'>{tools.length} travel utilities</p>
            </header>
            <div className='pt-6'>
                <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {tools.map((tool) => <Tool key={tool.path} tool={tool} />)}
                </section>
            </div>
        </main>
    )

}

export default Tools
