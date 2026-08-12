import {
    collection,
    doc,
    getDocs,
    limit,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { getTotalWeight } from '../utils/itemUtils'
import { commitInChunks } from './firestoreBatchService'
import { workerPost } from './workerClient'

const DEFAULT_PLAN_STRATEGY = { steps: [] }

const getPlanResultSummary = ({ success, totalWeight, baggageLimit }) => {
    if (!success) {
        return `Your bag is currently over the ${baggageLimit.toFixed(1)} kg limit at ${totalWeight.toFixed(1)} kg. Remove or replace a few heavier items and try again.`
    }

    return 'Everything looks good so far. Your packing list is within the baggage limit — continue to generate a packing strategy.'
}

const findTripPlan = async (uid, tripId) => {
    const snapshot = await getDocs(query(
        collection(db, 'plans'),
        where('userId', '==', uid),
        where('tripId', '==', tripId),
        limit(1),
    ))

    return snapshot.empty ? null : snapshot.docs[0]
}

const ensureTripPlan = async (uid, tripId) => {
    const existingPlan = await findTripPlan(uid, tripId)
    const tripRef = doc(db, 'trips', tripId)

    if (existingPlan) {
        await updateDoc(tripRef, { planId: existingPlan.id, updatedAt: serverTimestamp() })
        return existingPlan.ref
    }

    const planRef = doc(collection(db, 'plans'))
    const batch = writeBatch(db)
    batch.set(planRef, {
        userId: uid,
        tripId,
        result: null,
        strategy: DEFAULT_PLAN_STRATEGY,
        strategyItemIds: [],
        strategyStatus: null,
        strategyMeta: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })
    batch.update(tripRef, { planId: planRef.id, updatedAt: serverTimestamp() })
    await batch.commit()
    return planRef
}

const subscribeToTripPlan = (uid, tripId, onNext, onError) => {
    if (!uid || !tripId) {
        onNext(null)
        return () => {}
    }

    const planQuery = query(
        collection(db, 'plans'),
        where('userId', '==', uid),
        where('tripId', '==', tripId),
        limit(1),
    )

    return onSnapshot(planQuery, (snapshot) => {
        if (snapshot.empty) {
            onNext(null)
            return
        }

        const planDoc = snapshot.docs[0]
        onNext({ id: planDoc.id, ...planDoc.data() })
    }, onError)
}

const generatePlanResult = async (uid, trip, items) => {
    if (!uid) throw new Error('You must be logged in to generate a plan.')
    if (!trip?.id) throw new Error('Trip not found.')

    const totalWeight = getTotalWeight(items)
    const baggageLimit = Number(trip.baggageLimit) || 0
    const success = totalWeight <= baggageLimit
    const result = {
        success,
        summary: getPlanResultSummary({ success, totalWeight, baggageLimit }),
    }
    const planRef = await ensureTripPlan(uid, trip.id)

    await updateDoc(planRef, {
        result,
        strategy: DEFAULT_PLAN_STRATEGY,
        strategyItemIds: [],
        strategyStatus: null,
        strategyMeta: null,
        updatedAt: serverTimestamp(),
    })
    return result
}

const generatePlanStrategy = async (uid, tripId, items, suitcases) => {
    if (!uid) throw new Error('You must be logged in to generate a strategy.')
    if (!tripId) throw new Error('Trip not found.')

    const planRef = await ensureTripPlan(uid, tripId)
    await updateDoc(planRef, { strategyStatus: 'planning', updatedAt: serverTimestamp() })

    try {
        const data = await workerPost('/v1/ai/packing-strategy', { items, suitcases })
        const strategy = data?.strategy ?? DEFAULT_PLAN_STRATEGY
        const strategyItemIds = [...new Set(items.map((item) => item.id).filter(Boolean))]
        await updateDoc(planRef, {
            strategy,
            strategyItemIds,
            strategyStatus: 'completed',
            strategyMeta: {
                stageA: data?.meta ?? { source: 'fallback', provider: 'openai' },
                stageB: { source: 'disabled', error: null },
            },
            updatedAt: serverTimestamp(),
        })
        return strategy
    } catch (error) {
        await updateDoc(planRef, {
            strategyStatus: 'failed',
            strategyMeta: {
                stageA: { source: 'error', error: error.message },
                stageB: { source: 'disabled', error: null },
            },
            updatedAt: serverTimestamp(),
        })
        throw error
    }
}

const invalidateTripPlan = async (uid, tripId) => {
    if (!uid || !tripId) return

    const snapshot = await getDocs(query(
        collection(db, 'plans'),
        where('userId', '==', uid),
        where('tripId', '==', tripId),
    ))

    await commitInChunks(snapshot.docs, (batch, planDoc) => batch.delete(planDoc.ref))
    await updateDoc(doc(db, 'trips', tripId), { planId: null, updatedAt: serverTimestamp() })
}

const deleteTripPlan = invalidateTripPlan

export {
    deleteTripPlan,
    generatePlanResult,
    generatePlanStrategy,
    invalidateTripPlan,
    subscribeToTripPlan,
}
