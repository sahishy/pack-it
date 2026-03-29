import { Link } from 'react-router-dom'
import Button from './Button'

const Navbar = () => {
    return (
        <header className='sticky top-0 border-b border-neutral3 bg-white/80 backdrop-blur'>
            <div className='mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4'>
                <Link to='/' className='text-lg font-semibold tracking-tight text-neutral0'>
                    Pack-It
                </Link>

                <nav className='flex items-center gap-2'>
                    <Link to='/login'>
                        <Button variant='ghost'>Log In</Button>
                    </Link>

                    <Link to='/signup'>
                        <Button>Sign Up</Button>
                    </Link>
                </nav>
            </div>
        </header>
    )
}

export default Navbar