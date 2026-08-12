import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion as Motion, useScroll, useTransform } from 'motion/react'
import { ArrowRight, ChevronDown, CloudSun, Compass, Luggage } from 'lucide-react'
import LogoLarge from '@/assets/logo_lg.png'
import Cloud from '@/assets/images/cloud.png'
import Cloud2 from '@/assets/images/cloud_2.png'
import AuthModal from '@/components/auth/AuthModal'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

const reveal = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
}

const features = [
    { number: '01', icon: Compass, title: 'Personalized packing lists', description: 'Build a packing list based on your destination, travel dates, and planned activities.' },
    { number: '02', icon: CloudSun, title: 'Destination-aware planning', description: 'Prepare for expected weather and local conditions before you leave.' },
    { number: '03', icon: Luggage, title: 'Organized suitcase tracking', description: 'Track what is packed, what is missing, and where each item belongs.' },
]

const faqs = [
    ['Is Pack-It free to use?', 'Yes. You can create an account and start planning your next trip for free.'],
    ['Can I plan more than one trip?', 'Absolutely. Keep upcoming journeys, packing lists, and suitcases together in one organized place.'],
    ['Can I customize my packing list?', 'Every suggestion can be adjusted, removed, or expanded so your list always feels personal.'],
]

const sectionClass = 'mx-auto w-[min(1040px,calc(100%_-_48px))] py-[105px] max-[800px]:w-[min(1040px,calc(100%_-_36px))] max-[800px]:py-[76px]'
const headingClass = 'text-[clamp(2.55rem,4.7vw,4.65rem)] font-[560] leading-[.97] tracking-[-.06em]'
const kickerClass = 'text-[11px] font-[650] tracking-[.17em] text-[#6b777c] uppercase'
const footerCloudClass = 'absolute block w-[700px] max-w-none [&_img]:block [&_img]:w-full max-[800px]:w-[62vw]'

const footerClouds = [
    [footerCloudClass, 'left-[calc(50%_-_1048px)] top-[-201px] rotate-[5.68deg] max-[800px]:left-[-23vw] max-[800px]:top-[-22px]'],
    [footerCloudClass, 'left-[calc(50%_-_750px)] top-[-193px] rotate-[2.1deg] scale-x-[-1] max-[800px]:left-[-2vw] max-[800px]:top-[-19px]'],
    [footerCloudClass, 'left-[calc(50%_-_451px)] top-[-192px] rotate-[4.49deg] max-[800px]:left-[19vw] max-[800px]:top-[-19px]'],
    [footerCloudClass, 'left-[calc(50%_-_172px)] top-[-182px] rotate-[-1.5deg] scale-x-[-1] max-[800px]:left-[38vw] max-[800px]:top-[-15px]'],
    [footerCloudClass, 'left-[calc(50%_+_106px)] top-[-170px] rotate-[-1.58deg] max-[800px]:left-[57vw] max-[800px]:top-[-11px]'],
    [footerCloudClass, 'left-[calc(50%_+_385px)] top-[-178px] rotate-[2.8deg] scale-x-[-1] max-[800px]:left-[77vw] max-[800px]:top-[-14px]'],
    [footerCloudClass, 'hidden left-[calc(50%_+_663px)] top-[-170px] rotate-[-1.58deg] min-[1600px]:block'],
    [footerCloudClass, 'hidden left-[calc(50%_-_1645px)] top-[-201px] rotate-[5.68deg] min-[2100px]:block'],
]

const Landing = () => {
    const heroRef = useRef(null)
    const navigate = useNavigate()
    const { continueAsGuest } = useAuth()
    const [guestLoading, setGuestLoading] = useState(false)
    const [guestError, setGuestError] = useState('')
    const [searchParams, setSearchParams] = useSearchParams()
    const requestedAuthMode = searchParams.get('auth')
    const authMode = requestedAuthMode === 'login' || requestedAuthMode === 'signup' ? requestedAuthMode : null
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
    const heroCopyY = useTransform(scrollYProgress, [0, 1], [0, 120])
    const cloudsY = useTransform(scrollYProgress, [0, 1], [0, -60])
    const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])
    const openAuth = (mode) => setSearchParams({ auth: mode })
    const closeAuth = () => setSearchParams({}, { replace: true })
    const handleGuestContinue = async () => {
        try {
            setGuestError('')
            setGuestLoading(true)
            await continueAsGuest()
            navigate('/home')
        } catch (error) {
            setGuestError(error?.message ?? 'Unable to start a guest session right now.')
        } finally {
            setGuestLoading(false)
        }
    }

    return (
        <main className='landing-page min-h-screen overflow-clip bg-white font-sans text-[#15202a] [&_a]:no-underline [&_h1]:m-0 [&_h2]:m-0 [&_h3]:m-0 [&_p]:m-0'>
            <header className='pointer-events-none fixed inset-x-0 top-0 z-50 px-[22px] py-4 max-[800px]:p-[11px]'>
                <nav className='pointer-events-auto mx-auto grid min-h-[52px] w-full max-w-[620px] grid-cols-[1fr_auto_1fr] items-center rounded-[15px] bg-white/82 py-1.5 pr-[7px] pl-[19px] shadow-[0_18px_50px_rgba(36,88,112,.11)] backdrop-blur-[18px] max-[800px]:min-h-[50px] max-[800px]:grid-cols-[1fr_auto] max-[800px]:rounded-[13px] max-[800px]:pl-[15px]' aria-label='Primary navigation'>
                    <a href='#top' aria-label='Pack-It home'><img src={LogoLarge} alt='Pack-It' className='block w-[82px]' /></a>
                    <div className='flex gap-7 max-[800px]:hidden'>
                        {['About', 'Features', 'FAQ'].map((label) => <a key={label} href={`#${label.toLowerCase()}`} className='text-xs font-[550] text-[#48535c] transition-colors duration-250 hover:text-[#15202a]'>{label}</a>)}
                    </div>
                    <Button type='button' size='sm' onClick={() => openAuth('login')} className='justify-self-end rounded-lg!'>Log in</Button>
                </nav>
            </header>

            <section id='top' ref={heroRef} className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_145%_90%_at_50%_0%,#00aeff_0%,#88d9ff_58%,#fff_100%)] px-6 pt-[120px] pb-[150px] before:absolute before:inset-0 before:bg-[linear-gradient(105deg,rgba(255,255,255,.08),transparent_32%,rgba(255,255,255,.14)_72%,transparent)] before:content-[''] max-[800px]:min-h-[760px] max-[800px]:pt-[105px]">
                <div className='absolute top-[-20%] right-[5%] size-[60vw] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.27),transparent_65%)]' />
                <Motion.div className='relative z-[3] flex w-full max-w-[760px] flex-col items-center text-center' style={{ y: heroCopyY, opacity: heroOpacity }}>
                    <Motion.h1 className='flex flex-col items-center text-[clamp(2.9rem,5.4vw,4.9rem)] font-[580] leading-[1.02] tracking-[-.072em] [text-shadow:0_3px_24px_rgba(34,118,157,.1)] max-[800px]:text-[clamp(2.65rem,11vw,3.5rem)]' initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}>
                        <span className='bg-[linear-gradient(180deg,#fff_0%,rgba(255,255,255,.95)_42%,rgba(255,255,255,.62)_82%,rgba(255,255,255,.38)_100%)] bg-clip-text text-transparent'>Plan your trip packing</span>
                        <span className='bg-[linear-gradient(180deg,#fff_0%,rgba(255,255,255,.95)_42%,rgba(255,255,255,.62)_82%,rgba(255,255,255,.38)_100%)] bg-clip-text text-transparent'>with confidence.</span>
                    </Motion.h1>
                    <Motion.p className='mx-auto mt-4! block w-full max-w-[410px] self-center text-center! text-[clamp(.86rem,1.1vw,.98rem)] leading-[1.4] text-transparent bg-[linear-gradient(180deg,rgba(255,255,255,.94)_0%,rgba(255,255,255,.68)_100%)] bg-clip-text' style={{ textAlign: 'center' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
                        Pack-It helps travelers build practical packing lists fast, so you can focus on the fun part of traveling.
                    </Motion.p>
                    <Motion.div className='mt-10 flex items-center justify-center gap-[12px] max-[800px]:flex-col max-[800px]:gap-3' initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.52 }}>
                        <Button type='button' onClick={() => openAuth('signup')}>Create an account</Button>
                        <Button type='button' variant='secondary' loading={guestLoading} onClick={handleGuestContinue}>Continue as guest</Button>
                    </Motion.div>
                    {guestError ? <p className='mt-3 text-sm text-white'>{guestError}</p> : null}
                </Motion.div>
                <Motion.div className='pointer-events-none absolute inset-x-0 bottom-[-80px] z-[2] h-[34%] max-[800px]:bottom-[-8px] max-[800px]:h-1/4' style={{ y: cloudsY }} aria-hidden='true'>
                    <img src={Cloud} alt='' className='absolute bottom-[-8%] left-[-9%] w-[min(46vw,660px)] max-w-none rotate-[4deg] scale-x-[-1] opacity-96 max-[800px]:left-[-40%] max-[800px]:w-[88vw]' />
                    <img src={Cloud} alt='' className='absolute right-[-9%] bottom-[-6%] w-[min(46vw,660px)] max-w-none rotate-[-3deg] opacity-96 max-[800px]:right-[-42%] max-[800px]:w-[88vw]' />
                </Motion.div>
            </section>

            <section id='about' className={sectionClass}>
                <Motion.div {...reveal} className={kickerClass}>Complete packing plans</Motion.div>
                <Motion.div {...reveal} className='mt-[38px] grid grid-cols-[1.25fr_.75fr] items-end gap-[10%] max-[800px]:mt-[34px] max-[800px]:grid-cols-1 max-[800px]:gap-[45px]'>
                    <h2 className={headingClass}>One organized plan<br />for every trip.</h2>
                    <div>
                        <p className='text-[15px] leading-[1.65] text-[#647077]'>Pack-It keeps your packing lists, suitcases, and trip details together so you can prepare efficiently and avoid missing important items.</p>
                        <a href='#features' className='group mt-[22px] inline-flex items-center gap-[9px] border-b border-[#a9b0b2] pb-1 text-[13px] font-semibold text-[#15202a]'>View features <ArrowRight size={16} className='transition-transform duration-250 group-hover:translate-x-1' /></a>
                    </div>
                </Motion.div>
            </section>

            <section id='features' className={`${sectionClass} pt-[55px]`}>
                <Motion.div {...reveal} className='flex items-end justify-between max-[800px]:block'>
                    <span className={`${kickerClass} self-start pt-[13px]`}>Core features</span>
                    <h2 className={`${headingClass} text-right max-[800px]:mt-[30px] max-[800px]:text-left`}>Everything required<br />to stay organized.</h2>
                </Motion.div>
                <div className='mt-[50px] grid grid-cols-3 gap-3 max-[800px]:mt-9 max-[800px]:grid-cols-1'>
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <Motion.article key={feature.title} className={`min-h-[300px] rounded-[18px] border border-[#deddd7] bg-white/52 p-[23px] transition-[transform,background,box-shadow] duration-350 hover:-translate-y-2 hover:bg-white hover:shadow-[0_24px_70px_rgba(30,50,60,.09)] max-[800px]:min-h-[260px] ${index === 1 ? 'mt-6 max-[800px]:mt-0' : ''}`} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}>
                                <div className='flex items-center justify-between text-[#399dcb]'><span className='text-xs tracking-[.08em] text-[#9aa2a5]'>{feature.number}</span><Icon size={24} strokeWidth={1.5} /></div>
                                <h3 className='mt-28 text-lg font-[570] tracking-[-.025em] max-[800px]:mt-[78px]'>{feature.title}</h3>
                                <p className='mt-[11px] text-[13px] leading-[1.6] text-[#727b80]'>{feature.description}</p>
                            </Motion.article>
                        )
                    })}
                </div>
            </section>

            <section id='faq' className={`${sectionClass} grid grid-cols-[.75fr_1.25fr] items-start gap-[12%] max-[800px]:grid-cols-1 max-[800px]:gap-[54px]`}>
                <Motion.div {...reveal}>
                    <span className={kickerClass}>Frequently asked questions</span>
                    <h2 className='mt-[27px] text-[clamp(2.5rem,4vw,4rem)] font-[560] leading-[.97] tracking-[-.06em]'>Common questions<br />about Pack-It.</h2>
                </Motion.div>
                <Motion.div {...reveal} className='border-t border-[#cfd0cb]'>
                    {faqs.map(([question, answer]) => (
                        <details key={question} className='group border-b border-[#cfd0cb]'>
                            <summary className='flex cursor-pointer list-none items-center justify-between gap-5 py-[21px] text-[15px] font-[540] [&::-webkit-details-marker]:hidden'>{question}<ChevronDown size={19} className='shrink-0 transition-transform duration-300 group-open:rotate-180' /></summary>
                            <p className='max-w-[590px] pr-10 pb-[26px] text-sm leading-[1.65] text-[#6d777b]'>{answer}</p>
                        </details>
                    ))}
                </Motion.div>
            </section>

            <section className="relative min-h-[460px] mt-12 overflow-visible bg-[linear-gradient(180deg,#fff_0%,#f8f9f9_1.5%,#aeb3b6_7%,#505761_14%,#505761_100%)] px-6 pt-[145px] pb-[30px] text-white before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,.08),transparent_45%)] before:content-[''] max-[800px]:min-h-[440px] max-[800px]:px-5 max-[800px]:pt-[125px] max-[800px]:pb-6">
                <div className='pointer-events-none absolute inset-x-0 top-0 z-[2] h-0' aria-hidden='true'>
                    {footerClouds.map(([base, position], index) => <span key={index} className={`${base} ${position}`}><img src={Cloud2} alt='' /></span>)}
                </div>
                <footer className='relative z-[3] mx-auto flex min-h-[250px] w-full max-w-[1040px] flex-col items-center justify-end max-[800px]:min-h-[270px]'>
                    <div className='flex flex-col items-center gap-[13px]'><img src={LogoLarge} alt='Pack-It' className='w-[116px] brightness-0 invert max-[800px]:w-[104px]' /><p className='text-[11px] tracking-[.025em] text-white/52'>Organized packing for every trip.</p></div>
                    <div className='mt-14 flex w-full items-center justify-between border-t border-white/18 pt-5 max-[800px]:mt-14'>
                        <span className='text-[10px] text-white/38'>© 2026 Pack-It</span>
                        <div className='flex items-center gap-[25px] max-[800px]:gap-4'>
                            <a href='#about' className='text-[11px] text-white/62 transition-colors hover:text-white max-[800px]:hidden'>About</a>
                            <a href='#features' className='text-[11px] text-white/62 transition-colors hover:text-white max-[800px]:hidden'>Features</a>
                            <a href='#faq' className='text-[11px] text-white/62 transition-colors hover:text-white max-[800px]:hidden'>FAQ</a>
                            <Button type='button' variant='ghost' size='xs' onClick={() => openAuth('login')}>Log in</Button>
                        </div>
                    </div>
                </footer>
            </section>
            <AuthModal mode={authMode} onClose={closeAuth} onModeChange={openAuth} />
        </main>
    )
}

export default Landing
