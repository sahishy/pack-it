import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const NoSuitcaseModal = ({ open, onClose, onAddSuitcase }) => {
    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose?.() }}>
            <DialogContent className='gap-6 rounded-2xl! p-6 sm:max-w-lg'>
                <DialogHeader className='gap-2 pr-8'>
                    <DialogTitle className='text-xl'>Add a suitcase first</DialogTitle>
                    <DialogDescription className='max-w-md leading-6'>
                        You need at least one of your suitcases listed before we can generate a packing strategy.
                    </DialogDescription>
                </DialogHeader>
                <div className='grid grid-cols-2 gap-3'>
                    <Button className='w-full' variant='outline' onClick={onClose}>Cancel</Button>
                    <Button className='w-full' onClick={onAddSuitcase}>Add suitcase</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default NoSuitcaseModal
