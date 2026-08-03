import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const NoSuitcaseModal = ({ open, onClose, onAddSuitcase }) => {
    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose?.() }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add a suitcase first</DialogTitle>
                    <DialogDescription>
                        You need at least one of your suitcases listed before we can generate a packing strategy.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant='outline' onClick={onClose}>Cancel</Button>
                    <Button onClick={onAddSuitcase}>Add Suitcase</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default NoSuitcaseModal
