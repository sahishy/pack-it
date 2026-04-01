import { Link } from 'react-router-dom'
import Card from '../ui/Card'

const Tool = ({ tool }) => {

    const { name, description, path, icon: Icon, from, to } = tool

    return (
        <Link to={path}>
            <Card className='h-full flex items-center gap-4 transition hover:-translate-y-1 hover:shadow-xl'>
                <div
                    className='flex p-4 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm'
                    style={{
                        backgroundImage: `linear-gradient(to bottom right, ${from}, ${to})`,
                    }}
                >
                    <Icon className='text-3xl' />
                </div>

                <div className='min-w-0'>
                    <h2 className='text-lg font-semibold text-neutral0'>{name}</h2>
                    <p className='text-sm mt-1 text-neutral1'>{description}</p>
                </div>
            </Card>
        </Link>
    )

}

export default Tool