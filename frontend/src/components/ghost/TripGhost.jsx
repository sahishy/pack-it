import Card from '../ui/Card'

const TripGhost = () => {
    return (
        <Card className='flex h-full flex-col overflow-hidden p-0! animate-pulse'>
            <div className='h-52 w-full bg-neutral3' />

            <div className='flex flex-1 flex-col gap-1 p-4'>
                <div className='h-6 w-2/3 rounded bg-neutral3' />

                <div className='mt-2 flex items-center justify-between'>
                    <div className='h-4 w-1/3 rounded bg-neutral3' />
                    <div className='h-5 w-16 rounded-full bg-neutral3' />
                </div>

                <hr className='my-2 border-neutral3' />

                <div className='mt-auto flex items-center justify-between'>
                    <div className='h-5 w-24 rounded-full bg-neutral3' />
                    <div className='h-4 w-4 rounded bg-neutral3' />
                </div>
            </div>
        </Card>
    )
}

export default TripGhost