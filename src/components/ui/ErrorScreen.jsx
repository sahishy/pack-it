import { FaRobot } from "react-icons/fa6"
import Card from "./Card"

const ErrorScreen = ({ text = 'Something went wrong.', className = '' }) => {
    return (
        <div className={`min-h-screen flex items-center justify-center ${className}`}>
            <Card className="flex flex-col items-center text-center gap-3">
                <FaRobot className="text-6xl text-neutral2"/>
                <div className="flex flex-col gap-1">
                    <h1 className='text-xl font-bold'>Oops! There was an issue.</h1>
                    <p className='text-sm text-neutral1'>{text}</p>                    
                </div>
            </Card>
        </div>
    )
}

export default ErrorScreen