import { Router } from "express";
import { ClientController } from "../controllers/clients-controller";
import { ensureAuthenticated } from "../middleware/ensure-authenticated";
import {upload }from "../middleware/upload";

 
const clientsRoutes= Router()
const clientsController = new ClientController()

 
clientsRoutes.use((req, res, next) => {
	ensureAuthenticated(req, res, next).catch(next);
});
clientsRoutes.get('/', clientsController.getClients);
clientsRoutes.get('/:id', clientsController.getClientById)   ;   
clientsRoutes.post('/', upload.array('files', 5), clientsController.createClient)
clientsRoutes.patch('/:id', clientsController.updateClient)
clientsRoutes.delete('/:id', clientsController.deleteClient)
clientsRoutes.post('/:id/attachments', upload.array('files', 5), clientsController.addAttachment)
clientsRoutes.delete('/:id/attachments/:attachmentId', clientsController.deleteAttachment)  
clientsRoutes.get('/:id/attachments', clientsController.getAttachments)
clientsRoutes.get('/:id/attachments/:attachmentId/download', clientsController.downloadAttachment)







export {clientsRoutes}