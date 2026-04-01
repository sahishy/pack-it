import { FaRobot } from "react-icons/fa6"
import Card from "./Card"
import Button from "./Button"
import { useNavigate } from "react-router-dom"

const ErrorScreen = ({ text = 'Something went wrong.', className = '' }) => {

    const navigate = useNavigate();

    return (
        <div className={`min-h-screen bg-neutral5 flex items-center justify-center ${className}`}>
            <Card className="flex flex-col items-center text-center gap-3">
                <FaRobot className="text-6xl text-neutral2" />
                <div className="flex flex-col gap-1 items-center">
                    <h1 className='text-xl font-bold'>Oops! There was an issue.</h1>
                    <p className='text-sm text-neutral1 mb-4'>{text}</p>
                    <Button
                        variant="secondary"
                        onClick={() => navigate(`/home`)}
                    >
                        Return Home
                    </Button>
                </div>
            </Card>
        </div>
    )
}

export default ErrorScreen