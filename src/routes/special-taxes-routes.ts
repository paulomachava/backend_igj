import { Router } from "express";
import { SpecialTaxesController } from "../controllers/special-taxes-controllers";
import { ensureAuthenticated } from "../middleware/ensure-authenticated";



const specialTaxesRoutes = Router()
const specialTaxesController = new SpecialTaxesController()

specialTaxesRoutes.use((req, res, next) => {
    ensureAuthenticated(req, res, next).catch(next);
})


specialTaxesRoutes.post('/', specialTaxesController.createSpecialTax)
specialTaxesRoutes.get('/', specialTaxesController.getSpecialTaxes)
specialTaxesRoutes.get('/:id', specialTaxesController.getSpecialTaxById)
specialTaxesRoutes.patch('/:id', specialTaxesController.updateSpecialTax)
specialTaxesRoutes.delete('/:id', specialTaxesController.deleteSpecialTax)



export { specialTaxesRoutes }
