import express from 'express'
import cors from 'cors'
import config from './config.js'
import { requireAuth } from './middleware/auth.js'
import usersRouter from './routes/users.js'
import tripsRouter from './routes/trips.js'
import itemsRouter from './routes/items.js'
import plansRouter from './routes/plans.js'

const app = express()

app.use(cors({ origin: config.frontendOrigin }))
app.use(express.json())

app.get('/health', (_req, res) => {
    res.json({ ok: true })
})

app.use('/api/users', requireAuth, usersRouter)
app.use('/api', requireAuth, tripsRouter)
app.use('/api', requireAuth, itemsRouter)
app.use('/api', requireAuth, plansRouter)

app.use((error, _req, res, _next) => {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error.' })
})

app.listen(config.port, () => {
    console.log(`Backend server running with the following config:
        Port: ${config.port}
        Frontend Origin: ${config.frontendOrigin}
    `)
})


