import Card from '../ui/Card'

const ItemGhost = () => {
    return (
        <Card className='py-3! px-4! animate-pulse'>
            <div className='flex items-center justify-between'>
                <div className='flex min-w-0 items-center gap-3'>
                    <div className='h-5 w-5 rounded bg-neutral3' />

                    <div className='flex gap-3 items-center'>
                        <div className='h-8 w-8 rounded bg-neutral3' />
                        <div className='min-w-0 space-y-2'>
                            <div className='h-4 w-32 rounded bg-neutral3' />
                            <div className='h-3 w-24 rounded bg-neutral3' />
                        </div>
                    </div>
                </div>

                <div className='h-8 w-8 rounded-lg bg-neutral3' />
            </div>
        </Card>
    )
}

export default ItemGhost