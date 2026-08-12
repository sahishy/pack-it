import { writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'

const MAX_BATCH_OPERATIONS = 450

const chunk = (values, size = MAX_BATCH_OPERATIONS) => {
    const chunks = []

    for (let index = 0; index < values.length; index += size) {
        chunks.push(values.slice(index, index + size))
    }

    return chunks
}

const commitInChunks = async (values, applyOperation, size = MAX_BATCH_OPERATIONS) => {
    for (const valuesChunk of chunk(values, size)) {
        const batch = writeBatch(db)
        valuesChunk.forEach((value) => applyOperation(batch, value))
        await batch.commit()
    }
}

export { commitInChunks }
