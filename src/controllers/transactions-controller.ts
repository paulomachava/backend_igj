import { z } from "zod";
import { TransactionType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { Request, Response } from "express";


//transaction schema
const transactionSchema = z.object({
    clientId: z.string().uuid(),
    casinoId: z.string().uuid(),
    amount: z.number().positive(),
    date: z.string().or(z.date()),
    type:z.enum([TransactionType.bank, TransactionType.cash])
});




 class TransactionController{

    async createTransaction(req: Request, res: Response) {
        try {



            const { clientId, casinoId, amount, date, type } = transactionSchema.parse(req.body);
                  const userId = req.user?.id; // Get the userId from the request object
            // Check if the user is authenticated
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            // Check if the client exists
            const client = await prisma.client.findUnique({
                where: { id: clientId },
            });
            if (!client) {
                return res.status(404).json({ error: "Client not found" });
            }
                // Check if the casino exists
            const casino = await prisma.casino.findUnique({
                where: { id: casinoId },
            });
            if (!casino) {
                return res.status(404).json({ error: "Casino not found" });
            }
            // Check if the transaction type is valid
            if (!Object.values(TransactionType).includes(type)) {
                return res.status(400).json({ error: "Invalid transaction type" });
            }
            // Check if the date is valid
            if (isNaN(new Date(date).getTime())) {
                return res.status(400).json({ error: "Invalid date" });
            }
            
            // Check if the date is not in the future
            const transactionDate = new Date(date);
            const currentDate = new Date();
            if (transactionDate > currentDate) {
                return res.status(400).json({ error: "A data da transação não pode estar no futuro" });
            }
            // Check if the amount is valid
            if (amount <= 0) {
                return res.status(400).json({ error: "Invalid amount" });
            }
            const transaction = await prisma.transaction.create({
                data: {
                    clientId,
                    casinoId,
                    type,
                    amount,
                    date: new Date(date),
                    
                    userId // Include the userId in the transaction data
                }
            });
            return res.status(201).json(transaction);
         
        } catch (error) {
            return res.status(400).json({ error: error instanceof Error ? error.message : "Erro desconhecido" });
        }
    }

//get all transactions
async getTransactions(req: Request, res: Response) {
    try {
        //Pega page e pageSize dos query params, com valores padrão
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const skip = (page - 1) * pageSize;
        const take = pageSize;

        //Busca Transacoes paginadas
        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                skip,
            take,
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                casino: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                }
            },
                
            }),
            prisma.transaction.count(),
        ]);

        res.status(200).json({
            data: transactions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / pageSize),
            },
        });

     
       
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch interdictions' });
    }
}


//update transaction
async updateTransaction(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { clientId, casinoId, amount, date, type } = transactionSchema.parse(req.body);
        const transaction = await prisma.transaction.update({
            where: { id },
            data: {
                clientId,
                casinoId,
                amount,
                date: new Date(date),
                type,
            },
        });
        return res.status(200).json(transaction);
    } catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : "Erro desconhecido" });
    }
}

//get transaction by id
async getTransactionById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                client: true,
                casino: true,
            },
        });
        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        return res.status(200).json(transaction);
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }

}
//delete transaction
async deleteTransaction(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const transaction = await prisma.transaction.delete({
            where: { id },
        });
        return res.status(200).json(transaction);
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}
 }



export {TransactionController}