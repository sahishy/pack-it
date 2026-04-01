import { useEffect, useMemo, useState } from 'react'
import { FaGear, FaScaleBalanced } from 'react-icons/fa6'
import { IoSunny } from 'react-icons/io5'
import { useAuth } from '../contexts/AuthContext'
import Card from '../components/ui/Card'
import Select from '../components/popover/Select'
import { updateUserPreferences } from '../services/userService'

const THEME_OPTIONS = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
]

const MEASUREMENT_OPTIONS = [
    { value: 'metric', label: 'Metric', alias: 'kg, km, ºC' },
    { value: 'imperial', label: 'Imperial', alias: 'lb, mi, ºF' },
]

const Settings = () => {

    const { user, profile } = useAuth()
    const [theme, setTheme] = useState('')
    const [measurementSystem, setMeasurementSystem] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        setTheme(profile?.preferences?.theme ?? '')
        setMeasurementSystem(profile?.preferences?.measurementSystem ?? '')
    }, [profile?.preferences?.measurementSystem, profile?.preferences?.theme])

    const savePreferences = async (nextPreferences) => {
        if (!user?.uid) {
            return
        }

        try {
            setError('')
            await updateUserPreferences(user.uid, nextPreferences)
        } catch (saveError) {
            setError(saveError?.message ?? 'Unable to save preferences right now.')
        }
    }

    const preferences = useMemo(() => ({
        theme,
        measurementSystem,
    }), [measurementSystem, theme])

    const handleThemeChange = async (nextTheme) => {
        setTheme(nextTheme)
        await savePreferences({
            ...preferences,
            theme: nextTheme,
        })
    }

    const handleMeasurementSystemChange = async (nextMeasurementSystem) => {
        setMeasurementSystem(nextMeasurementSystem)
        await savePreferences({
            ...preferences,
            measurementSystem: nextMeasurementSystem,
        })
    }

    return (
        <main className='min-h-screen'>
            <section className='w-full bg-none from-primary0 to-primary1 lg:bg-linear-to-r'>
                <div className='m-6 flex max-w-4xl flex-col gap-6 rounded-xl bg-linear-to-r from-primary0 to-primary1 px-6 py-10 lg:m-auto lg:bg-none'>
                    <div className='flex flex-col items-center gap-2 lg:items-start'>
                        <h2 className='flex items-center gap-2 text-sm text-neutral3'>
                            <FaGear className='text-lg' />
                            Make it yours.
                        </h2>
                        <h1 className='text-4xl font-bold text-neutral4 lg:text-5xl'>Settings</h1>
                        <p className='text-neutral4/90'>Customize your app preferences</p>
                    </div>
                </div>
            </section>

            <div className='mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-4 lg:py-10'>
                <section className='flex flex-col gap-4 lg:gap-6'>
                    <Card className='flex flex-col gap-4'>
                        <div className='flex items-center gap-3'>
                            <IoSunny className='text-lg' />
                            <h2 className='text-lg font-semibold text-neutral0'>Appearance</h2>
                        </div>

                        <Select
                            id='theme'
                            label='Theme'
                            value={theme}
                            onChange={handleThemeChange}
                            options={THEME_OPTIONS}
                            placeholder='Select theme'
                        />
                    </Card>

                    <Card className='flex flex-col gap-4'>
                        <div className='flex items-center gap-3'>
                            <FaScaleBalanced className='text-lg' />
                            <h2 className='text-lg font-semibold text-neutral0'>Units</h2>
                        </div>

                        <Select
                            id='measurement-system'
                            label='Measurement System'
                            value={measurementSystem}
                            onChange={handleMeasurementSystemChange}
                            options={MEASUREMENT_OPTIONS}
                            placeholder='Select measurement system'
                        />
                    </Card>
                </section>

                {error ? <p className='text-sm text-negative1'>{error}</p> : null}
            </div>
        </main>
    )

}

export default Settings