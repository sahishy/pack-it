import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandShortcut,
} from '@/components/ui/command'

const CommandPalette = ({
    open,
    onClose,
    query,
    onQueryChange,
    items = [],
    onSelect,
    getItemId = (item) => item.id,
    getItemLabel = (item) => item.name,
    getItemDescription = () => null,
    getItemThumbnail = (item) => item.logo,
    title = 'Select an option',
    placeholder = 'Search...',
    emptyMessage = 'No results found.',
}) => (
    <CommandDialog
        open={open}
        onOpenChange={(nextOpen) => {
            if (!nextOpen) onClose?.()
        }}
        title={title}
        description={placeholder}
    >
        <Command shouldFilter={false}>
            <CommandInput value={query} onValueChange={onQueryChange} placeholder={placeholder} />
            <CommandList>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup heading={title}>
                    {items.map((item) => {
                        const label = getItemLabel(item)
                        const description = getItemDescription(item)
                        const thumbnail = getItemThumbnail(item)

                        return (
                            <CommandItem
                                key={getItemId(item)}
                                value={String(getItemId(item))}
                                onSelect={() => onSelect?.(item)}
                            >
                                {thumbnail ? (
                                    typeof thumbnail === 'string' ? (
                                        <img src={thumbnail} alt='' className='size-4 rounded-sm object-cover' />
                                    ) : thumbnail
                                ) : null}
                                <span>{label}</span>
                                {description ? <CommandShortcut>{description}</CommandShortcut> : null}
                            </CommandItem>
                        )
                    })}
                </CommandGroup>
            </CommandList>
        </Command>
    </CommandDialog>
)

export default CommandPalette
