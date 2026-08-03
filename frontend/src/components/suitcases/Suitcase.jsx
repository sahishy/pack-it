import { Luggage, MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import useWeightFormatter from '@/hooks/useWeightFormatter'

const Suitcase = ({ suitcase, onDelete, deleting = false }) => {
    const { formatDimensions } = useWeightFormatter()

    return (
        <Card className='min-h-48'>
            <CardHeader>
                <div className='flex items-start justify-between'>
                    <div className='flex size-11 items-center justify-center rounded-lg border bg-muted/30'>
                        <Luggage className='size-5 text-muted-foreground' />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant='ghost' size='icon' />}>
                            <MoreHorizontal />
                            <span className='sr-only'>Suitcase actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                            <DropdownMenuItem variant='destructive' disabled={deleting} onClick={() => onDelete?.(suitcase.id)}>
                                <Trash2 /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <CardTitle className='pt-5 text-xl'>{suitcase.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className='text-sm text-muted-foreground'>Interior dimensions</p>
                <p className='mt-1 font-medium tabular-nums'>{formatDimensions(suitcase.dimensions, { decimals: 1 })}</p>
            </CardContent>
        </Card>
    )
}

export default Suitcase
