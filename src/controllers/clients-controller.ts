import { ClientIDType, AttachmentType } from "@prisma/client";
import { z } from "zod";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import multer from 'multer';

    function determineAttachmentType(mimetype: string): AttachmentType {
        if (mimetype.includes('pdf')) {
            return 'PDF';
        } else if (mimetype.includes('image')) {
            return 'Image';
        } else {
            return 'Document';
        }
    }

// Função para validar número de identificação baseado no tipo
function validateIdNumber(id_type: ClientIDType, id_number: string): boolean {
    switch (id_type) {
        case ClientIDType.BI:
            // BI: 12 números + 1 letra no final (total 13 caracteres)
            return /^\d{12}[A-Za-z]$/.test(id_number);
        case ClientIDType.carta_conducao:
            // Carta de condução: apenas 8 números
            return /^\d{8}$/.test(id_number);
        case ClientIDType.Dir:
            // Dire: 13 caracteres - 10 números e 3 letras (3ª, 4ª e última posição)
            return /^\d{2}[A-Za-z]{2}\d{8}[A-Za-z]$/.test(id_number);
        case ClientIDType.passporte:
            // Passaporte: 2 letras + 7 números (total 9 caracteres)
            return /^[A-Za-z]{2}\d{7}$/.test(id_number);
        default:
            return false;
    }
}

// Função para formatar telefone com prefixo +258
function formatPhoneNumber(phone: string): string {
    // Remove todos os caracteres não numéricos
    const numbersOnly = phone.replace(/\D/g, '');
    
    // Se já começa com 258, adiciona o +
    if (numbersOnly.startsWith('258')) {
        return `+${numbersOnly}`;
    }
    
    // Se não tem o prefixo, adiciona +258
    return `+258${numbersOnly}`;
}

//zod schema for client
const clientSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    phone: z.string()
        .optional()
        .transform((val) => val ? formatPhoneNumber(val) : val)
        .refine((val) => !val || /^\+258\d{9}$/.test(val), {
            message: "Telefone deve ter o formato +258 seguido de 9 dígitos"
        }),
    email: z.string().email("Email inválido").optional(),
    id_type: z.enum([ClientIDType.BI, ClientIDType.Dir, ClientIDType.carta_conducao, ClientIDType.passporte], { required_error: "O tipo de identificação é obrigatório" }),
    id_number: z.string().min(1, "O número de identificação é obrigatório"),
    casino_id: z.string().uuid("O ID do casino é obrigatório"),
}).refine((data) => validateIdNumber(data.id_type, data.id_number), {
    message: "Formato do número de identificação inválido para o tipo selecionado",
    path: ["id_number"]
});

/**
 * Controller responsável por gerenciar operações relacionadas a clientes.
 */
class ClientController {

    /**
     * Cria um novo cliente.
     * @param req - Objeto de requisição contendo os dados do cliente e arquivos opcionais.
     * @param res - Objeto de resposta para enviar o resultado da operação.
     */
    async createClient(req: Request, res: Response) {
        try {
            console.log("Request body:", req.body); // Log the incoming request body
            const { name, phone, email, id_type, id_number, casino_id } = clientSchema.parse(req.body);

            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            // Check if the client already exists
            const existingClient = await prisma.client.findFirst({
                where: { id_number },
            });
            if (existingClient) {
                return res.status(409).json({ error: "Client already exists" });
            }
            //check if the casino exists        
            const existingCasino = await prisma.casino.findFirst({
                where: { id: casino_id },
            });
            if (!existingCasino) {
                return res.status(409).json({ error: "Casino does not exist" });
            }

            //create client
            const client = await prisma.client.create({
                data: {
                    name,
                    phone,
                    email,
                    id_type,
                    id_number,
                    casino_id,
                    userId,
                },
                include: {
                    casino: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            });

            // Handle file uploads if any
            if (req.files) {
                const files = req.files as Express.Multer.File[];

                for (const file of files) {
                    await prisma.clientAttachment.create({
                        data: {
                            name: file.originalname,
                            type: determineAttachmentType(file.mimetype),
                            url: file.path,
                            clientId: client.id
                        }
                    });
                }
            }

            res.status(201).json(client);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error("Validation errors:", error.errors); // Log validation errors
                return res.status(400).json({ errors: error.errors }); // Return detailed validation errors
            }
            console.error("Error creating client:", error);
            res.status(500).json({ error: "Failed to create client" });
        }
    }

    /**
     * Obtém todos os clientes.
     * @param req - Objeto de requisição.
     * @param res - Objeto de resposta para enviar a lista de clientes.
     */
    async getClients(req: Request, res: Response) {
        try {
            // Pega page e pageSize dos query params, com valores padrão
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 10;
            const skip = (page - 1) * pageSize;
            const take = pageSize;

            // Busca clientes paginados
            const [clients, total] = await Promise.all([
                prisma.client.findMany({
                    skip,
                    take,
                    include: {
                        casino: {
                            select: {
                                id: true,
                                name: true,
                            }
                        },
                        user: {
                            select: {
                                id: true,
                                name: true,
                            }
                        },
                        clients_attachments: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                            }
                        }
                    },
                }),
                prisma.client.count(),
            ]);

            res.status(200).json({
                data: clients,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / pageSize),
                    totalItems: total,
                    pageSize,
                }
            });
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch clients" });
        }
    }

    /**
     * Obtém um cliente pelo ID.
     * @param req - Objeto de requisição contendo o ID do cliente nos parâmetros.
     * @param res - Objeto de resposta para enviar os dados do cliente.
     */
    async getClientById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const client = await prisma.client.findUnique({
                where: { id },
                include: {
                    casino: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                    clients_attachments: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        }
                    }
                },
            });
            if (!client) {
                return res.status(404).json({ error: "Client not found" });
            }
            res.status(200).json(client);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch client" });
        }
    }

    /**
     * Atualiza os dados de um cliente existente.
     * @param req - Objeto de requisição contendo os dados atualizados do cliente.
     * @param res - Objeto de resposta para enviar o resultado da operação.
     */
    async updateClient(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, phone, email, id_type, id_number, casino_id } = clientSchema.parse(req.body);

            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            // Check if the client already exists
            const existingClient = await prisma.client.findFirst({
                where: { id },
            });
            if (!existingClient) {
                return res.status(409).json({ error: "Client does not exist" });
            }
            //check if the casino exists        
            const existingCasino = await prisma.casino.findFirst({
                where: { id: casino_id },
            });
            if (!existingCasino) {
                return res.status(409).json({ error: "Casino does not exist" });
            }

            //update client
            const client = await prisma.client.update({
                where: { id },
                data: {
                    name,
                    phone,
                    email,
                    id_type,
                    id_number,
                    casino_id,
                    userId,
                },
                include: {
                    casino: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            });

            // Handle file uploads if any
            if (req.files) {
                const files = req.files as Express.Multer.File[];

                for (const file of files) {
                    await prisma.clientAttachment.create({
                        data: {
                            name: file.originalname,
                            type: determineAttachmentType(file.mimetype),
                            url: file.path,
                            clientId: client.id
                        }
                    });
                }
            }

            res.status(200).json(client);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error("Validation errors:", error.errors); // Log validation errors
                return res.status(400).json({ errors: error.errors }); // Return detailed validation errors
            }
            console.error("Error creating client:", error);
            res.status(500).json({ error: "Failed to create client" });
        }
    }

    /**
     * Exclui um cliente pelo ID.
     * @param req - Objeto de requisição contendo o ID do cliente nos parâmetros.
     * @param res - Objeto de resposta para confirmar a exclusão.
     */
    async deleteClient(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // First, check if the client exists
            const existingClient = await prisma.client.findUnique({
                where: { id },
                include: {
                    clients_attachments: true,
                    transactions: true,
                    interdictions: true,
                    occurrences: true,
                }
            });

            if (!existingClient) {
                return res.status(404).json({ error: "Client not found" });
            }

            console.log(`Attempting to delete client ${id} with:`, {
                attachments: existingClient.clients_attachments.length,
                transactions: existingClient.transactions.length,
                interdictions: existingClient.interdictions.length,
                occurrences: existingClient.occurrences.length,
            });

            // Use a transaction to ensure all deletions succeed or fail together
            const deletedClient = await prisma.$transaction(async (tx) => {
                // Delete related records first (in order of dependencies)
                
                // 1. Delete client attachments (should cascade automatically, but being explicit)
                if (existingClient.clients_attachments.length > 0) {
                    await tx.clientAttachment.deleteMany({
                        where: { clientId: id }
                    });
                    console.log(`Deleted ${existingClient.clients_attachments.length} client attachments`);
                }

                // 2. Delete transactions
                if (existingClient.transactions.length > 0) {
                    await tx.transaction.deleteMany({
                        where: { clientId: id }
                    });
                    console.log(`Deleted ${existingClient.transactions.length} transactions`);
                }

                // 3. Delete interdiction attachments first, then interdictions
                if (existingClient.interdictions.length > 0) {
                    for (const interdiction of existingClient.interdictions) {
                        await tx.interdictionAttachment.deleteMany({
                            where: { interdictionId: interdiction.id }
                        });
                    }
                    await tx.interdiction.deleteMany({
                        where: { clientId: id }
                    });
                    console.log(`Deleted ${existingClient.interdictions.length} interdictions`);
                }

                // 4. Delete occurrence attachments first, then occurrences
                if (existingClient.occurrences.length > 0) {
                    for (const occurrence of existingClient.occurrences) {
                        await tx.occurrenceAttachment.deleteMany({
                            where: { occurrenceId: occurrence.id }
                        });
                    }
                    await tx.occurrence.deleteMany({
                        where: { clientId: id }
                    });
                    console.log(`Deleted ${existingClient.occurrences.length} occurrences`);
                }

                // 5. Finally, delete the client
                const deletedClient = await tx.client.delete({
                where: { id },
                include: {
                    casino: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                },
            });

                return deletedClient;
            });

            console.log(`Successfully deleted client ${id}`);
            res.status(200).json(deletedClient);
        } catch (error) {
            console.error("Error deleting client:", error);
            
            // Provide more specific error messages
            if (error instanceof Error) {
                if (error.message.includes('Foreign key constraint')) {
                    return res.status(409).json({ 
                        error: "Cannot delete client due to existing related records",
                        details: error.message 
                    });
                }
                if (error.message.includes('Record to delete does not exist')) {
                    return res.status(404).json({ error: "Client not found" });
                }
            }
            
            res.status(500).json({ 
                error: "Failed to delete client",
                details: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    /**
     * Adiciona anexos a um cliente.
     * @param req - Objeto de requisição contendo os arquivos e o ID do cliente.
     * @param res - Objeto de resposta para confirmar o upload dos arquivos.
     */
    async addAttachment(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const files = req.files as Express.Multer.File[];
            
            if (!files || files.length === 0) {
                return res.status(400).json({ error: "No files provided" });
            }
            
            // Verifica se o cliente existe
            const client = await prisma.client.findUnique({
                where: { id },
            });
            if (!client) {
                return res.status(404).json({ error: "Client not found" });
            }

            // Prepara dados dos anexos usando map()
            const attachments = files.map((file) => ({
                name: file.originalname,
                type: determineAttachmentType(file.mimetype),
                url: file.path,
                clientId: id,
            }));

            // Insere todos os anexos de uma vez
            await prisma.clientAttachment.createMany({
                data: attachments,
            });

            res.status(201).json({ message: "Files uploaded successfully" });
        } catch (error) {
            res.status(500).json({ error: "Failed to upload files" });
        }
    }

    /**
     * Exclui um anexo de um cliente.
     * @param req - Objeto de requisição contendo o ID do cliente e o ID do anexo.
     * @param res - Objeto de resposta para confirmar a exclusão do anexo.
     */
    async deleteAttachment(req: Request, res: Response) {
        try {
            const { id, attachmentId } = req.params;

            if (!attachmentId) {
                return res.status(400).json({ error: "Attachment ID is required" });
            }

            console.log("Client ID:", id); // Log client ID
            console.log("Attachment ID:", attachmentId); // Log attachment ID

            const client = await prisma.client.findUnique({
                where: { id },
            });
            if (!client) {
                console.error("Client not found");
                return res.status(404).json({ error: "Client not found" });
            }

            const attachment = await prisma.clientAttachment.findUnique({
                where: { id: attachmentId },
            });
            if (!attachment) {
                console.error("Attachment not found");
                return res.status(404).json({ error: "Attachment not found" });
            }

            await prisma.clientAttachment.delete({
                where: { id: attachmentId },
            });

            console.log("Attachment deleted successfully");
            res.status(200).json({ message: "Attachment deleted successfully" });
        } catch (error) {
            console.error("Error deleting attachment:", error);
            res.status(500).json({ error: "Failed to delete attachment" });
        }
    }

    //get all attachments from client
    async getAttachments(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const attachments = await prisma.clientAttachment.findMany({
                where: { clientId: id },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    url: true,
                    createdAt: true,
                }
            });
            res.status(200).json(attachments);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch attachments" });
        }
    } 

    //download attachment from client
    async downloadAttachment(req: Request, res: Response) {
        try {
            const { id, attachmentId } = req.params;
            const attachment = await prisma.clientAttachment.findUnique({
                where: { id: attachmentId },
            });
            if (!attachment) {
                return res.status(404).json({ error: "Attachment not found" });
            }
            res.download(attachment.url, attachment.name);
        } catch (error) {
            res.status(500).json({ error: "Failed to download attachment" });
        }
    }
}

export { ClientController }