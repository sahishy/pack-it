import BasePopover from './BasePopover'

const Dropdown = ({ trigger, children, align = 'right' }) => {
    return (
        <BasePopover
            trigger={trigger}
            align={align}
            contentClassName='min-w-56 rounded-xl border border-neutral3 bg-primary0 p-2 shadow-lg shadow-shadow'
        >
            {children}
        </BasePopover>
    )
}

export default Dropdown