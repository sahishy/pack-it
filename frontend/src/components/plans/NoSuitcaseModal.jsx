import BaseModal from '../ui/BaseModal'
import Button from '../ui/Button'

const NoSuitcaseModal = ({ open, onClose, onAddSuitcase }) => {
    return (
        <BaseModal
            open={open}
            onClose={onClose}
            title='Add a suitcase first'
            footer={(
                <div className='flex items-center gap-3'>
                    <Button variant='secondary' className='flex-1' onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={onAddSuitcase} className='flex-1'>
                        Add Suitcase
                    </Button>
                </div>
            )}
        >
            <p className='text-sm text-neutral1'>
                You need at least one of your suitcases listed before we can generate a packing strategy.
            </p>
        </BaseModal>
    )
}

export default NoSuitcaseModal