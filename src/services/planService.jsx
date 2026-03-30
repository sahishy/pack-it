import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    getFirestore,
    limit,
    onSnapshot,
    query,
    updateDoc,
    where,
} from 'firebase/firestore'
import { getPlanResultSummary, getStrategySteps } from './aiService'
import {
    buildDefaultPlanPayload,
    DEFAULT_PLAN_STRATEGY,
    evaluatePlanStatus,
    normalizeStrategy,
} from '../utils/planUtils'

const setTripPlanId = async (tripId, planId) => {
    if (!tripId) {
        return
    }

    const db = getFirestore()
    const tripRef = doc(db, 'trips', tripId)

    await updateDoc(tripRef, {
        planId: planId ?? null,
    })
}

const findTripPlan = async (uid, tripId) => {
    const db = getFirestore()
    const plansRef = collection(db, 'plans')
    const planQuery = query(
        plansRef,
        where('userId', '==', uid),
        where('tripId', '==', tripId),
        limit(1),
    )

    const snapshot = await getDocs(planQuery)

    if (snapshot.empty) {
        return null
    }

    const planDoc = snapshot.docs[0]

    return {
        id: planDoc.id,
        ...planDoc.data(),
    }
}

const ensureTripPlan = async (uid, tripId) => {
    const existingPlan = await findTripPlan(uid, tripId)

    if (existingPlan?.id) {
        await setTripPlanId(tripId, existingPlan.id)
        return existingPlan.id
    }

    const db = getFirestore()
    const plansRef = collection(db, 'plans')
    const payload = buildDefaultPlanPayload(uid, tripId)
    const docRef = await addDoc(plansRef, payload)

    await setTripPlanId(tripId, docRef.id)

    return docRef.id
}

const subscribeToTripPlan = (uid, tripId, onNext, onError) => {
    if (!uid || !tripId) {
        onNext(null)
        return () => {}
    }

    const db = getFirestore()
    const plansRef = collection(db, 'plans')
    const planQuery = query(
        plansRef,
        where('userId', '==', uid),
        where('tripId', '==', tripId),
        limit(1),
    )

    return onSnapshot(
        planQuery,
        (snapshot) => {
            if (snapshot.empty) {
                void setTripPlanId(tripId, null)
                onNext(null)
                return
            }

            const planDoc = snapshot.docs[0]
            void setTripPlanId(tripId, planDoc.id)
            onNext({
                id: planDoc.id,
                ...planDoc.data(),
            })
        },
        onError,
    )
}

const generatePlanResult = async (uid, trip, items) => {
    if (!uid) {
        throw new Error('You must be logged in to generate a plan result.')
    }

    if (!trip?.id) {
        throw new Error('Trip not found.')
    }

    const { success, totalWeight, baggageLimit } = evaluatePlanStatus({ trip, items })
    const summary = getPlanResultSummary({ success, totalWeight, baggageLimit })

    const result = {
        success,
        summary,
    }

    const planId = await ensureTripPlan(uid, trip.id)
    const db = getFirestore()
    const planRef = doc(db, 'plans', planId)

    await updateDoc(planRef, {
        result,
        strategy: DEFAULT_PLAN_STRATEGY,
        updatedAt: new Date(),
    })

    return result
}

const generatePlanStrategy = async (uid, tripId, items) => {
    if (!uid) {
        throw new Error('You must be logged in to generate a plan strategy.')
    }

    if (!tripId) {
        throw new Error('Trip not found.')
    }

    const aiStrategy = await getStrategySteps({ items })
    const strategy = normalizeStrategy(aiStrategy)

    const planId = await ensureTripPlan(uid, tripId)
    const db = getFirestore()
    const planRef = doc(db, 'plans', planId)

    await updateDoc(planRef, {
        strategy,
        updatedAt: new Date(),
    })

    return strategy
}

const deleteTripPlan = async (uid, tripId) => {
    if (!uid || !tripId) {
        return
    }

    const existingPlan = await findTripPlan(uid, tripId)

    if (!existingPlan?.id) {
        await setTripPlanId(tripId, null)
        return
    }

    const db = getFirestore()
    const planRef = doc(db, 'plans', existingPlan.id)
    await deleteDoc(planRef)
    await setTripPlanId(tripId, null)
}

export {
    subscribeToTripPlan,
    generatePlanResult,
    generatePlanStrategy,
    deleteTripPlan,
}