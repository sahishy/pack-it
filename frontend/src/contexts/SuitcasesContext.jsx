import { createContext, useContext, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import useUserSuitcases from '../hooks/useUserSuitcases'
import {
    analyzeSuitcaseImage,
    createSuitcase,
    deleteSuitcase,
    updateSuitcase,
} from '../services/suitcaseService'

const SuitcasesContext = createContext()

const SuitcasesProvider = ({ children }) => {
    const { user } = useAuth()
    const { suitcases, loading, error } = useUserSuitcases(user?.uid)

    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [visionLoading, setVisionLoading] = useState(false)
    const [visionError, setVisionError] = useState(null)

    const addSuitcase = async (suitcaseData, confidence = {}) => {
        if(!user?.uid) {
            throw new Error('You must be logged in to add a suitcase.')
        }

        try {
            setSaving(true)
            setSaveError(null)
            return await createSuitcase(user.uid, suitcaseData, confidence)
        } catch (errorValue) {
            setSaveError(errorValue)
            throw errorValue
        } finally {
            setSaving(false)
        }
    }

    const editSuitcase = async (suitcaseId, suitcaseData) => {
        try {
            setSaving(true)
            setSaveError(null)
            await updateSuitcase(suitcaseId, suitcaseData)
        } catch (errorValue) {
            setSaveError(errorValue)
            throw errorValue
        } finally {
            setSaving(false)
        }
    }

    const removeSuitcase = async (suitcaseId) => {
        try {
            setSaving(true)
            setSaveError(null)
            await deleteSuitcase(suitcaseId)
        } catch (errorValue) {
            setSaveError(errorValue)
            throw errorValue
        } finally {
            setSaving(false)
        }
    }

    const runSuitcaseVision = async ({ file }) => {
        try {
            setVisionLoading(true)
            setVisionError(null)
            return await analyzeSuitcaseImage({ file })
        } catch (errorValue) {
            setVisionError(errorValue)
            throw errorValue
        } finally {
            setVisionLoading(false)
        }
    }

    const value = useMemo(() => ({
        suitcases,
        loading,
        error,
        saving,
        saveError,
        visionLoading,
        visionError,
        addSuitcase,
        editSuitcase,
        removeSuitcase,
        runSuitcaseVision,
    }), [
        suitcases,
        loading,
        error,
        saving,
        saveError,
        visionLoading,
        visionError,
    ])

    return (
        <SuitcasesContext.Provider value={value}>
            {children}
        </SuitcasesContext.Provider>
    )
}

const useSuitcases = () => useContext(SuitcasesContext)

export {
    SuitcasesProvider,
    useSuitcases,
}
