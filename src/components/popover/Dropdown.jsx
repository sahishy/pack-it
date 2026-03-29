import BasePopover from './BasePopover'

const Dropdown = ({ trigger, children }) => {
    return (
        <BasePopover
            trigger={trigger}
            contentClassName='min-w-56 rounded-xl border border-neutral3 bg-neutral5 p-2 shadow-md shadow-shadow'
        >
            {children}
        </BasePopover>
    )
}

export default Dropdown