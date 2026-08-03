import { useNavigate } from 'react-router-dom'
import { Luggage, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useSuitcases } from '@/contexts/SuitcasesContext'
import Suitcase from '@/components/suitcases/Suitcase'

const Suitcases = () => {
    const navigate = useNavigate()
    const { suitcases, loading, error, saving, saveError, removeSuitcase } = useSuitcases()

    return (
        <main className='mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12'>
            <header className='flex items-end justify-between gap-4 border-b pb-8'>
                <div>
                    <p className='text-sm text-muted-foreground'>Your gear</p>
                    <h1 className='mt-1 text-3xl font-semibold tracking-tight'>Suitcases</h1>
                    <p className='mt-2 max-w-xl text-sm text-muted-foreground'>Saved luggage dimensions help the packing assistant build more realistic plans.</p>
                </div>
                <Button onClick={() => navigate('/suitcases/new')}><Plus /> Add suitcase</Button>
            </header>

            <section className='pt-8'>
                {error || saveError ? <p className='mb-4 text-sm text-destructive'>{error?.message ?? saveError?.message}</p> : null}
                {loading ? (
                    <Card><CardContent className='text-sm text-muted-foreground'>Loading suitcases…</CardContent></Card>
                ) : suitcases.length === 0 ? (
                    <div className='flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 text-center'>
                        <Luggage className='mb-4 size-8 text-muted-foreground' />
                        <h2 className='font-medium'>No suitcases saved</h2>
                        <p className='mt-1 text-sm text-muted-foreground'>Add the luggage you travel with most often.</p>
                    </div>
                ) : (
                    <div className='grid gap-5 md:grid-cols-2'>
                        {suitcases.map((suitcase) => (
                            <Suitcase key={suitcase.id} suitcase={suitcase} onDelete={removeSuitcase} deleting={saving} />
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}

export default Suitcases
