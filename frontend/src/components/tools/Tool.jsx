import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'

const Tool = ({ tool }) => {

    const { name, description, path, icon: Icon, colors = ['#318def', '#13acdc'] } = tool
    const [fromColor, toColor] = colors

    return (
        <Link to={path} className='group block h-full'>
            <Card className='h-full gap-0 p-2! transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_14px_32px_rgba(31,41,55,0.08)]'>
                <div
                    className='relative h-24 shrink-0 rounded-xl'
                    style={{
                        background: `radial-gradient(circle at 72% 12%, ${toColor}38 0%, transparent 58%), radial-gradient(circle at 15% 100%, ${fromColor}2e 0%, transparent 62%), ${fromColor}0d`,
                    }}
                >
                    <div className='absolute -bottom-6 left-1/2 flex size-12 -translate-x-1/2 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105'>
                        <Icon className='text-xl' style={{ color: fromColor }} />
                    </div>
                </div>
                <div className='flex min-h-32 flex-col px-3 pt-9 pb-3'>
                    <h2 className='font-heading text-base font-medium leading-snug'>{name}</h2>
                    <p className='text-sm leading-relaxed text-muted-foreground'>{description}</p>
                </div>
            </Card>
        </Link>
    )

}

export default Tool
