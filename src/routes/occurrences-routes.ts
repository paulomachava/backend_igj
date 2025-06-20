import { Router } from "express";
import { OccurrencesController } from "../controllers/occurrences-controller";
import { ensureAuthenticated } from "../middleware/ensure-authenticated";
import { upload } from "../middleware/upload";




const occurrencesRoutes = Router()
const occurrencesController = new OccurrencesController()

occurrencesRoutes.use((req, res, next) => {
    ensureAuthenticated(req, res, next).catch(next);
})

occurrencesRoutes.get('/', occurrencesController.getOccurrences)
occurrencesRoutes.post('/',upload.array( 'files',5), occurrencesController.createOccurrence)
occurrencesRoutes.get('/:id', occurrencesController.getOccurrenceById)
occurrencesRoutes.delete('/:id', occurrencesController.deleteOccurrence)
occurrencesRoutes.put('/:id',upload.array( 'files',5), occurrencesController.updateOccurrence)
occurrencesRoutes.post('/:id/attachments',upload.array('files',5), occurrencesController.addAttachment)
occurrencesRoutes.delete('/:id/attachments/:attachmentId', occurrencesController.deleteAttachment)
occurrencesRoutes.get('/:id/attachments', occurrencesController.getAttachments) 





export { occurrencesRoutes }