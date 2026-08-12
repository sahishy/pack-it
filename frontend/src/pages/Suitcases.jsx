import { useState } from 'react'
import { Luggage, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useSuitcases } from '@/contexts/SuitcasesContext'
import Suitcase from '@/components/suitcases/Suitcase'
import EditSuitcaseModal from '@/components/suitcases/EditSuitcaseModal'
import NewSuitcase from './NewSuitcase'

const Suitcases = () => {
    const { suitcases, loading, error, saving, saveError, editSuitcase, removeSuitcase } = useSuitcases()
    const [editingSuitcase, setEditingSuitcase] = useState(null)
    const [editError, setEditError] = useState(null)
    const [isNewSuitcaseOpen, setIsNewSuitcaseOpen] = useState(false)

    const handleEditSuitcase = async (suitcaseData) => {
        try {
            setEditError(null)
            await editSuitcase(editingSuitcase.id, suitcaseData)
            setEditingSuitcase(null)
        } catch (errorValue) {
            setEditError(errorValue)
        }
    }

    return (
        <main className='mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 lg:py-12'>
            <header className='flex items-center justify-between gap-4'>
                <div>
                    <h1 className='text-xl font-medium tracking-tight'>Suitcases</h1>
                    {!loading ? <p className='mt-1 text-sm text-muted-foreground'>{suitcases.length === 1 ? '1 saved suitcase' : `${suitcases.length} saved suitcases`}</p> : null}
                </div>
                <Button size='sm' onClick={() => setIsNewSuitcaseOpen(true)}><Plus /> Add suitcase</Button>
            </header>

            <section className='pt-6'>
                {error || saveError ? <p className='mb-4 text-sm text-destructive'>{error?.message ?? saveError?.message}</p> : null}
                {loading ? (
                    <Card className='p-2!'><CardContent className='py-10 text-center text-sm text-muted-foreground'>Loading suitcases…</CardContent></Card>
                ) : suitcases.length === 0 ? (
                    <div className='flex min-h-64 flex-col items-center justify-center px-6 text-center'>
                        <div className='mb-4 flex size-11 items-center justify-center rounded-lg bg-muted'><Luggage className='size-5 text-muted-foreground' /></div>
                        <h2 className='font-medium'>No suitcases yet</h2>
                        <p className='mt-1 max-w-xs text-sm text-muted-foreground'>Save your luggage dimensions once to make future packing plans more accurate.</p>
                    </div>
                ) : (
                    <div className='grid gap-4 sm:grid-cols-2'>
                        {suitcases.map((suitcase) => (
                            <Suitcase key={suitcase.id} suitcase={suitcase} onEdit={(selectedSuitcase) => { setEditError(null); setEditingSuitcase(selectedSuitcase) }} onDelete={removeSuitcase} deleting={saving} />
                        ))}
                    </div>
                )}
            </section>
            {editingSuitcase ? (
                <EditSuitcaseModal
                    open
                    suitcase={editingSuitcase}
                    onClose={() => { if (!saving) { setEditingSuitcase(null); setEditError(null) } }}
                    onSubmit={handleEditSuitcase}
                    saving={saving}
                    error={editError}
                />
            ) : null}
            {isNewSuitcaseOpen ? <NewSuitcase open onClose={() => setIsNewSuitcaseOpen(false)} /> : null}
        </main>
    )
}

export default Suitcases
