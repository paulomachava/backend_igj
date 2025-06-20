import { Router } from "express";
import { InterdictionsController } from "../controllers/interdictions-controller";
import { ensureAuthenticated } from "../middleware/ensure-authenticated";
import { upload } from "../middleware/upload";





const interdictionsRoutes =Router()
const interdictionsController = new InterdictionsController()

interdictionsRoutes.use((req, res, next) => {
	ensureAuthenticated(req, res, next).catch(next);
})

interdictionsRoutes.get('/', interdictionsController.getInterdictions)
interdictionsRoutes.get('/:id', interdictionsController.getInterdictionById)
interdictionsRoutes.post('/',upload.array( 'files',5), interdictionsController.createInterdiction)
interdictionsRoutes.patch('/:id', interdictionsController.updateInterdiction)
interdictionsRoutes.delete('/:id', interdictionsController.deleteInterdiction)
interdictionsRoutes.get('/:id/attachments', interdictionsController.getAttachments)
interdictionsRoutes.get('/:id/attachments/:attachmentId/download', interdictionsController.downloadAttachment)
interdictionsRoutes.post('/:id/attachments',upload.array('files', 5), interdictionsController.addAttachment)
interdictionsRoutes.delete('/:id/attachments/:attachmentId', interdictionsController.deleteAttachment)


interdictionsRoutes.post('/:id/approve', interdictionsController.approveInterdiction)
//reject interdiction
interdictionsRoutes.post('/:id/reject', interdictionsController.rejectInterdiction)


export {interdictionsRoutes}