import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Navbar from '../components/ui/Navbar'
import { FaSuitcaseRolling } from 'react-icons/fa6'

const features = [
    {
        title: 'Smart Packing Lists',
        description: 'Build personalized lists by trip type, weather, and destination in minutes.',
    },
    {
        title: 'Never Forget Essentials',
        description: 'Track must-haves like passports, chargers, and medications with reminders.',
    },
    {
        title: 'Organized Trips',
        description: 'Keep all your upcoming trip packing plans in one clean dashboard.',
    },
]

const Landing = () => {

    return (
        <main className='min-h-screen bg-neutral4 text-neutral0'>

            <Navbar />

            <section className='mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center'>

                <div>
                    <p className='mb-3 text-sm font-medium uppercase tracking-wide text-neutral1'>Pack-It</p>
                    <h1 className='text-4xl font-bold tracking-tight sm:text-5xl'>
                        Plan your trip packing with confidence.
                    </h1>
                    <p className='mt-4 max-w-xl text-base text-neutral1 sm:text-lg'>
                        Pack-It helps travelers build practical packing lists fast, so you can focus on the fun
                        part of traveling.
                    </p>

                    <div className='mt-8 flex flex-wrap gap-3'>
                        <Link to='/signup'>
                            <Button>Get Started</Button>
                        </Link>
                        <Link to='/login'>
                            <Button variant='secondary'>
                                Log In
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card className='overflow-hidden p-0 flex items-center justify-center py-32'>
                    <FaSuitcaseRolling className='text-9xl text-primary0'/>
                </Card>

            </section>

            <section className='mx-auto w-full max-w-6xl px-6 pb-16'>
                <div className='grid gap-4 md:grid-cols-3'>
                    {features.map((feature) => (
                        <Card key={feature.title}>
                            <h3 className='text-lg font-semibold'>{feature.title}</h3>
                            <p className='mt-2 text-sm text-neutral1'>{feature.description}</p>
                        </Card>
                    ))}
                </div>
            </section>
            
        </main>
    )
}

export default Landing
