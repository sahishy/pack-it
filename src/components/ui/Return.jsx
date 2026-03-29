import { FaArrowLeft } from "react-icons/fa6"
import { Link } from "react-router-dom"

const Return = () => {
    return (
        <Link to='/home' className='justify-self-start mr-auto px-3 py-2 rounded-xl text-sm text-neutral0 hover:bg-neutral4 flex items-center gap-3 transition'>
            <FaArrowLeft />
            Back to Home
        </Link>
    )
}

export default Return