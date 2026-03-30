import { FaChevronLeft } from "react-icons/fa6"
import { Link } from "react-router-dom"

const Return = ( {text, link} ) => {
    return (
        <Link to={link || '/home'} className='justify-self-start mr-auto px-3 py-2 rounded-xl text-sm font-medium text-neutral0 hover:bg-neutral4 flex items-center gap-3 transition'>
            <FaChevronLeft />
            {text || 'Back'}
        </Link>
    )
}

export default Return