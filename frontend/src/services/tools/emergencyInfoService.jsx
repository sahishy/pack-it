const EMERGENCY_INFO_STORAGE_KEY = 'pack-it.emergency-info'

const getDefaultEmergencyInfo = () => ({
    passportNumber: '',
    bloodType: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    localEmbassyAddress: '',
    travelInsuranceDetails: '',
    medicalAllergiesConditions: '',
    additionalNotes: '',
})

const getEmergencyInfo = () => {

    try {

        const storedValue = localStorage.getItem(EMERGENCY_INFO_STORAGE_KEY)
        if(!storedValue) {
            return getDefaultEmergencyInfo()
        }

        const parsed = JSON.parse(storedValue)

        return {
            ...getDefaultEmergencyInfo(),
            ...parsed,
        }

    } catch {
        return getDefaultEmergencyInfo()
    }

}

const saveEmergencyInfo = (payload) => {

    const nextValue = {
        ...getDefaultEmergencyInfo(),
        ...(payload ?? {}),
    }

    localStorage.setItem(EMERGENCY_INFO_STORAGE_KEY, JSON.stringify(nextValue))

    return nextValue
    
}

export {
    getDefaultEmergencyInfo,
    getEmergencyInfo,
    saveEmergencyInfo,
}