import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import useWeightFormatter from '@/hooks/useWeightFormatter'
import suitcasePlaceholder from '@/assets/images/suitcase_placeholder.png'

const Suitcase = ({ suitcase, onEdit, onDelete, deleting = false }) => {
    const { formatDimensions } = useWeightFormatter()

    return (
        <Card className='h-full gap-0! overflow-hidden p-2! transition-shadow hover:shadow-[0_12px_30px_rgba(31,41,55,0.06)]'>
            <div className='relative aspect-[12/9] overflow-hidden rounded-xl bg-muted'>
                <img
                    src={suitcasePlaceholder}
                    alt=''
                    className='pl-8 size-full scale-90 rotate-[2deg] object-contain opacity-40 transition-transform duration-500 group-hover/card:scale-[0.94]'
                />
            </div>
            <CardHeader className='pb-0 pt-4'>
                <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                        <CardTitle className='truncate text-lg'>{suitcase.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant='ghost' size='icon-sm' className='shrink-0' />}>
                            <MoreHorizontal />
                            <span className='sr-only'>Suitcase actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                            <DropdownMenuItem disabled={deleting} onClick={() => onEdit?.(suitcase)}>
                                <Pencil /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem variant='destructive' disabled={deleting} onClick={() => onDelete?.(suitcase.id)}>
                                <Trash2 /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className='pb-4 pt-2'>
                <p className='text-xs text-muted-foreground'>{formatDimensions(suitcase.dimensions, { decimals: 1 })}</p>
            </CardContent>
        </Card>
    )
}

export default Suitcase
