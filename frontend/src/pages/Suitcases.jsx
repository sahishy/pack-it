import { useNavigate } from 'react-router-dom'
import { FaSuitcaseRolling } from 'react-icons/fa6'
import { FiPlus } from 'react-icons/fi'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useSuitcases } from '../contexts/SuitcasesContext'
import Suitcase from '../components/suitcases/Suitcase'

const Suitcases = () => {
    const navigate = useNavigate()
    const {
        suitcases,
        loading,
        error,
        saving,
        saveError,
        removeSuitcase,
    } = useSuitcases()

    return (
        <main className='min-h-screen bg-neutral5'>
            <section className='w-full bg-none from-primary0 to-primary1 lg:bg-linear-to-r'>
                <div className='m-6 flex max-w-4xl flex-col gap-6 px-6 py-10 rounded-xl bg-linear-to-r from-primary0 to-primary1 lg:m-auto lg:bg-none'>
                    <div className='flex flex-col gap-2 items-center lg:items-start'>
                        <h2 className='flex gap-2 items-center text-sm text-white/80'><FaSuitcaseRolling className='text-lg' />Suitcase manager</h2>
                        <h1 className='text-4xl lg:text-5xl font-bold text-white'>Suitcases</h1>
                        <p className='text-white/80'>Track your suitcase dimensions and assign items more intelligently.</p>
                    </div>
                </div>
            </section>

            <div className='mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-4 lg:py-10'>
                <div className='flex items-center justify-between gap-3'>
                    <h2 className='text-xl font-semibold text-neutral0'>Your suitcases</h2>
                    <Button className='flex items-center gap-2' onClick={() => navigate('/suitcases/new')}>
                        <FiPlus /> Add suitcase
                    </Button>
                </div>

                {error ? <p className='text-sm text-negative1'>{error.message}</p> : null}
                {saveError ? <p className='text-sm text-negative1'>{saveError.message}</p> : null}

                <section className='flex flex-col gap-3'>
                    {loading ? (
                        <Card>
                            <p className='text-neutral1'>Loading suitcases...</p>
                        </Card>
                    ) : suitcases.length === 0 ? (
                        <div className='flex flex-col gap-3 items-center justify-center py-16'>
                            <div className='p-6 bg-neutral4 rounded-full'>
                                <FaSuitcaseRolling className='text-4xl text-neutral1' />
                            </div>
                            <div className='flex flex-col items-center'>
                                <p className='text-neutral0 font-semibold'>No suitcases yet.</p>
                                <p className='text-sm text-neutral1'>Click "Add Suitcase" to add your suitcases.</p>
                            </div>
                        </div>
                    ) : (
                        <div className='grid gap-3 sm:grid-cols-2'>
                            {suitcases.map((suitcase) => (
                                <Suitcase
                                    key={suitcase.id}
                                    suitcase={suitcase}
                                    onDelete={removeSuitcase}
                                    deleting={saving}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    )

}

export default Suitcases