import { Router } from 'express'
import { userRoutes } from './users-routes'
import { casinoRoutes } from './casinos-routes'
import { sessionsRoutes } from './sessions-routes'
import { clientsRoutes } from './clients-routes'
import { interdictionsRoutes } from './interdictions-routes'
import { transactionsRoutes } from './transactions-routes'
import { occurrencesRoutes } from './occurrences-routes'
import { specialTaxesRoutes } from './special-taxes-routes'
import { stampTaxesRoutes } from './stamp-taxes-routes'


const routes = Router()



routes.use('/users', userRoutes)
routes.use('/casinos', casinoRoutes)
routes.use('/sessions', sessionsRoutes)
routes.use('/clients', clientsRoutes)
routes.use('/interdictions', interdictionsRoutes)
routes.use('/transactions', transactionsRoutes)
routes.use('/occurrences', occurrencesRoutes)
routes.use('/special-taxes', specialTaxesRoutes)
routes.use('/stamp-taxes', stampTaxesRoutes)


export { routes }
