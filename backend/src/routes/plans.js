import { Router } from 'express'
import { db } from '../lib/firebaseAdmin.js'
import { serializeDoc } from '../utils/firestoreUtils.js'
import { getPlanResultSummary, getStrategySemanticSteps } from '../utils/aiUtils.js'
import {
    buildDefaultPlanPayload,
    DEFAULT_PLAN_STRATEGY,
    evaluatePlanStatus,
    normalizeStrategy,
} from '../utils/planUtils.js'

const plansRouter = Router()

const getTripRef = (tripId) => db.collection('trips').doc(tripId)

const assertTripOwnership = async (tripId, uid) => {

    const tripRef = getTripRef(tripId)
    const snapshot = await tripRef.get()

    if(!snapshot.exists) {
        return { status: 404, message: 'Trip not found.' }
    }

    if(snapshot.data()?.userId !== uid) {
        return { status: 403, message: 'Forbidden.' }
    }

    return { tripRef, trip: { id: snapshot.id, ...snapshot.data() } }

}

const findTripPlan = async (uid, tripId) => {

    const snapshot = await db
        .collection('plans')
        .where('userId', '==', uid)
        .where('tripId', '==', tripId)
        .limit(1)
        .get();

    if(snapshot.empty) {
        return null
    }

    const planDoc = snapshot.docs[0]
    return {
        id: planDoc.id,
        ...planDoc.data(),
    }

}

const setTripPlanId = async (tripRef, planId) => {

    await tripRef.update({
        planId: planId ?? null,
        updatedAt: new Date(),
    })

}

const ensureTripPlan = async (uid, tripRef, tripId) => {

    const existingPlan = await findTripPlan(uid, tripId)

    if(existingPlan?.id) {
        await setTripPlanId(tripRef, existingPlan.id)
        return existingPlan.id
    }

    const payload = buildDefaultPlanPayload(uid, tripId)
    const docRef = await db.collection('plans').add(payload)

    await setTripPlanId(tripRef, docRef.id)
    return docRef.id

}

plansRouter.get('/trips/:tripId/plan', async (req, res) => {

    const uid = req.user.uid
    const { tripId } = req.params
    const ownership = await assertTripOwnership(tripId, uid)

    if(!ownership.tripRef) {
        return res.status(ownership.status).json({ message: ownership.message })
    }

    const existingPlan = await findTripPlan(uid, tripId)

    if(!existingPlan) {
        await setTripPlanId(ownership.tripRef, null)
        return res.json({ plan: null })
    }

    await setTripPlanId(ownership.tripRef, existingPlan.id)
    const snapshot = await db.collection('plans').doc(existingPlan.id).get()

    return res.json({ plan: serializeDoc(snapshot) })

})

plansRouter.post('/trips/:tripId/plan/result', async (req, res) => {

    const uid = req.user.uid
    const { tripId } = req.params
    const { items = [] } = req.body ?? {}
    const ownership = await assertTripOwnership(tripId, uid)

    if(!ownership.tripRef) {
        return res.status(ownership.status).json({ message: ownership.message })
    }

    const { success, totalWeight, baggageLimit } = evaluatePlanStatus({
        trip: ownership.trip,
        items,
    })

    const result = {
        success,
        summary: getPlanResultSummary({ success, totalWeight, baggageLimit }),
    }

    const planId = await ensureTripPlan(uid, ownership.tripRef, tripId)
    const planRef = db.collection('plans').doc(planId)

    await planRef.update({
        result,
        strategy: DEFAULT_PLAN_STRATEGY,
        strategyStatus: null,
        strategyMeta: null,
        updatedAt: new Date(),
    })

    const snapshot = await planRef.get()
    return res.json({ result, plan: serializeDoc(snapshot) })

})

plansRouter.post('/trips/:tripId/plan/strategy', async (req, res) => {

    const uid = req.user.uid
    const { tripId } = req.params
    const { items = [] } = req.body ?? {}
    const ownership = await assertTripOwnership(tripId, uid)

    if(!ownership.tripRef) {
        return res.status(ownership.status).json({ message: ownership.message })
    }

    const suitcasesSnapshot = await db
        .collection('suitcases')
        .where('userId', '==', uid)
        .get()

    const suitcases = suitcasesSnapshot.docs.map(serializeDoc)
    const planId = await ensureTripPlan(uid, ownership.tripRef, tripId)
    const planRef = db.collection('plans').doc(planId)

    const aiCallStartedAt = Date.now()
    console.info('[AI][route] plan-strategy.start', {
        route: 'POST /trips/:tripId/plan/strategy',
        uid,
        tripId,
        itemsCount: Array.isArray(items) ? items.length : 0,
        suitcasesCount: suitcases.length,
    })

    await planRef.update({
        strategyStatus: 'planning',
        updatedAt: new Date(),
    })

    const semanticStrategy = await getStrategySemanticSteps({ items, suitcases })
    const normalizedSemanticStrategy = normalizeStrategy(semanticStrategy)

    console.info('[AI][route] plan-strategy.success', {
        route: 'POST /trips/:tripId/plan/strategy',
        uid,
        tripId,
        itemsCount: Array.isArray(items) ? items.length : 0,
        suitcasesCount: suitcases.length,
        stageASource: semanticStrategy?.meta?.source ?? 'unknown',
        elapsedMs: Date.now() - aiCallStartedAt,
    })

    await planRef.update({
        strategy: normalizedSemanticStrategy,
        strategyStatus: 'completed',
        strategyMeta: {
            stageA: semanticStrategy?.meta ?? { source: 'fallback', error: 'Unknown Stage A status.' },
            stageB: {
                source: 'disabled',
                error: null,
            },
        },
        updatedAt: new Date(),
    })

    // re-enable stage B layout generation (getStrategyLayoutSteps) later when coordinate visuals are brought back

    const snapshot = await planRef.get()
    return res.json({ strategy: normalizedSemanticStrategy, plan: serializeDoc(snapshot) })

})

plansRouter.delete('/trips/:tripId/plan', async (req, res) => {

    const uid = req.user.uid
    const { tripId } = req.params
    const ownership = await assertTripOwnership(tripId, uid)

    if(!ownership.tripRef) {
        return res.status(ownership.status).json({ message: ownership.message })
    }

    const existingPlan = await findTripPlan(uid, tripId)

    if(!existingPlan?.id) {
        await setTripPlanId(ownership.tripRef, null)
        return res.status(204).send()
    }

    await db.collection('plans').doc(existingPlan.id).delete()
    await setTripPlanId(ownership.tripRef, null)

    return res.status(204).send()

})

export default plansRouter
