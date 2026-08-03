import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import logo_sm_white from '../../assets/logo_sm_white.png'
import PlaneFlyingVideo from '../../assets/videos/plane_flying.mp4'

const ensureMutedPlayback = (event) => {
    const video = event.currentTarget
    video.muted = true
    video.defaultMuted = true
    video.volume = 0
}

const Landing = () => {
    return (
        <main className='capacitor-safe-area-landing relative isolate flex h-svh min-h-[42rem] overflow-hidden bg-[#07111a] text-white'>
            <video autoPlay muted loop playsInline disablePictureInPicture onLoadedMetadata={ensureMutedPlayback} onCanPlay={ensureMutedPlayback} className='absolute inset-0 size-full scale-x-[-1] object-cover' aria-hidden='true'>
                <source src={PlaneFlyingVideo} type='video/mp4' />
            </video>
            <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(3,13,22,0.42)_0%,rgba(3,13,22,0.26)_42%,rgba(2,8,13,0.92)_100%)]' />
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_70%_16%,rgba(44,103,143,0.2),transparent_42%)]' />

            <div className='relative z-10 mx-auto flex w-full max-w-sm flex-col'>
                <section className='flex flex-1 flex-col items-center justify-center pb-80 text-center'>
                    <img src={logo_sm_white} alt='' className='mb-4 size-15 brightness-0 invert' />
                    <h1 className='max-w-xs text-[2rem] font-semibold leading-[1.08] tracking-tight'>Plan your trip packing with confidence.</h1>
                </section>

                <div className='space-y-4'>
                    <Button render={<Link to='/capacitor/signup' />} nativeButton={false} className='h-12 p-8! text-lg w-full rounded-xl bg-white text-[#07111a] hover:bg-white/90'>Get started</Button>
                    <Button render={<Link to='/capacitor/login' />} nativeButton={false} variant='secondary' className='h-12 p-8! text-lg w-full rounded-xl border border-white/10 bg-white/10 text-white hover:bg-white/16'>Log in</Button>
                </div>
            </div>
        </main>
    )
}

export default Landing
