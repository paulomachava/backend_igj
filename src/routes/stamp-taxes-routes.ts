import { Router } from "express";
import { StampTaxesController } from "../controllers/stamp-taxes-controller";
import { ensureAuthenticated } from "../middleware/ensure-authenticated";



const stampTaxesRoutes = Router()
const stampTaxesController = new StampTaxesController()


stampTaxesRoutes.use((req, res, next) => {
    ensureAuthenticated(req, res, next).catch(next);
})

stampTaxesRoutes.post('/', stampTaxesController.createStampTax)
stampTaxesRoutes.get('/', stampTaxesController.getStampTaxes)
stampTaxesRoutes.patch('/:id',stampTaxesController.updateStampTax)
stampTaxesRoutes.get('/:id',stampTaxesController.getStampTaxById)
stampTaxesRoutes.delete('/:id',stampTaxesController.deleteStampTax)
stampTaxesRoutes.get('/casino/:casinoId',stampTaxesController.getStampTaxByCasinoId)

//  route for getStampTaxesByCasinoIdAndDateRange
//stampTaxesRoutes.get('/casino/:casinoId/date-range',stampTaxesController.getStampTaxesByCasinoIdAndDateRange)
// route for getStampTaxesByCasinoIdAndDateRange using query params (req.query)







export{stampTaxesRoutes}