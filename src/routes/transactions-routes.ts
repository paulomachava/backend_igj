import { Router } from "express";
import { TransactionController } from "../controllers/transactions-controller";
import { ensureAuthenticated } from "../middleware/ensure-authenticated";





const transactionsRoutes = Router()
const transactionsController = new TransactionController() 


transactionsRoutes.use((req, res, next) => {
    ensureAuthenticated(req, res, next).catch(next);
})

transactionsRoutes.post('/', transactionsController.createTransaction)
transactionsRoutes.get('/', transactionsController.getTransactions)
transactionsRoutes.get('/:id', transactionsController.getTransactionById)
transactionsRoutes.patch('/:id', transactionsController.updateTransaction)
transactionsRoutes.delete('/:id', transactionsController.deleteTransaction)





export{ transactionsRoutes }