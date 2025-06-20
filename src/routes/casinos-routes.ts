import { Router } from "express";
import {CasinoController} from "../controllers/casino-controller";
import { ensureAuthenticated } from "../middleware/ensure-authenticated";


const casinoRoutes = Router()

const casinoController = new CasinoController()

casinoRoutes.use((req, res, next) => {
	ensureAuthenticated(req, res, next).catch(next);
});

casinoRoutes.get("/", casinoController.getCasinos)
casinoRoutes.get("/:id", casinoController.getCasinoById)
casinoRoutes.post("/", casinoController.createCasino)
casinoRoutes.patch("/:id", casinoController.updateCasino)
casinoRoutes.delete("/:id", casinoController.deleteCasino)
export { casinoRoutes } 