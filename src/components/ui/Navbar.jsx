import { Link } from 'react-router-dom'
import Button from './Button'
import LogoLarge from '../../assets/logo_lg.png'

const Navbar = () => {
    return (
        <header className='sticky top-0 border-b border-neutral3 bg-white/80 backdrop-blur'>
            <div className='mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3'>
                <Link to='/' className='text-lg font-semibold tracking-tight text-neutral0'>
                    <img src={LogoLarge} alt='Pack-It Logo' className='w-24' />
                </Link>

                <nav className='flex items-center gap-2'>
                    <Link to='/login'>
                        <Button variant='secondary' className='px-3! py-2!'>Log In</Button>
                    </Link>

                    <Link to='/signup'>
                        <Button className='px-3! py-2!'>Sign Up</Button>
                    </Link>
                </nav>
            </div>
        </header>
    )
}

export default Navbar