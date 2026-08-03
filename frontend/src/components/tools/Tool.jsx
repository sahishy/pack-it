import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const Tool = ({ tool }) => {

    const { name, description, path, icon: Icon } = tool

    return (
        <Link to={path} className='group block h-full'>
            <Card className='h-full transition-shadow group-hover:shadow-[0_12px_30px_rgba(31,41,55,0.06)]'>
                <CardHeader>
                    <div className='flex items-start justify-between'>
                        <div className='flex size-10 items-center justify-center rounded-lg border bg-muted/30'>
                            <Icon className='text-lg text-muted-foreground' />
                        </div>
                        <ArrowUpRight className='size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5' />
                    </div>
                    <CardTitle className='pt-4'>{name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-sm leading-relaxed text-muted-foreground'>{description}</p>
                </CardContent>
            </Card>
        </Link>
    )

}

export default Tool
