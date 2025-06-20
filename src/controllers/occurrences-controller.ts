import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AttachmentType, OccurrenceStatus } from '@prisma/client';




function determineAttachmentType(mimetype: string): AttachmentType {
    if (mimetype.includes('pdf')) {
        return 'PDF';
    } else if (mimetype.includes('image')) {
        return 'Image';
    } else {
        return 'Document';
    }
}

// Adicione estas funções de validação
const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
const hourRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

//occurrence schema
const occurrenceSchema = z.object({
    clientId: z.string().uuid(),
    casinoId: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().min(1),
    date: z.string()
        .regex(dateRegex, "Data deve estar no formato dd-mm-yyyy")
        .refine((date) => {
            const [day, month, year] = date.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);
            return dateObj.getDate() === day && 
                   dateObj.getMonth() === month - 1 && 
                   dateObj.getFullYear() === year;
        }, "Data inválida"),
    hour: z.string()
        .regex(hourRegex, "Hora deve estar no formato HH:mm"),
    status: z.enum([OccurrenceStatus.em_analise, OccurrenceStatus.pendente, OccurrenceStatus.resolvido])
        .default(OccurrenceStatus.pendente),
});

class OccurrencesController {

    async createOccurrence(req: Request, res: Response) {
        try {
            const { clientId, casinoId, title, description, date, hour, status } = occurrenceSchema.parse(req.body);
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: "Usuário não autenticado" });
            }

            // Check if the client exists
            const client = await prisma.client.findUnique({
                where: { id: clientId },
            });
            if (!client) {
                return res.status(404).json({ error: "Cliente não encontrado" });
            }

            // Check if the casino exists
            const casino = await prisma.casino.findUnique({
                where: { id: casinoId },
            });
            if (!casino) {
                return res.status(404).json({ error: "Casino não encontrado" });
            }

            const occurrence = await prisma.occurrence.create({
                data: {
                    clientId,
                    casinoId,
                    title,
                    description,
                    date,
                    hour,
                    status,
                    userId
                }
            });

            //handle file uploads if any
            if (req.files && Array.isArray(req.files)) {
                const attachments = req.files.map((file: Express.Multer.File) => {
                    return {
                        name: file.originalname,
                        type: determineAttachmentType(file.mimetype),
                        url: file.path,
                        occurrenceId: occurrence.id,
                    };
                });
                await prisma.occurrenceAttachment.createMany({
                    data: attachments,
                });
            }
            return res.status(201).json(occurrence);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ 
                    error: "Erro de validação",
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            } else if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            } else {
                return res.status(500).json({ error: "Falha ao criar ocorrência" });
            }
        }
    }

    //get all occurrences
    async getOccurrences(req: Request, res: Response) {
        try {
            //Pega page e pageSize dos query params, com valores padrão
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 10;
            const skip = (page - 1) * pageSize;
            const take = pageSize;

            //Busca Ocorrencias paginadas
            const [occurrences, total] = await Promise.all([
                prisma.occurrence.findMany({
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
                    occurrences_attachments: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                
                        },
                    },
                },
                    
                }),
                prisma.occurrence.count(),
            ]);

            res.status(200).json({
                data: occurrences,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / pageSize),
                },
            });

         
           
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch occurrences' });
        }
    }


    //get occurrence by id
    async getOccurrenceById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const occurrence = await prisma.occurrence.findUnique({
                where: { id },
                include: {
                    client: true,
                    casino: true,
                    occurrences_attachments: true,
                },
            });
            if (!occurrence) {
                return res.status(404).json({ error: "Occurrence not found" });
            }
            return res.status(200).json(occurrence);
        } catch (error) {
            return res.status(500).json({ error: "Failed to fetch occurrence" });
        }
    }
    //update occurrence
    async updateOccurrence(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { clientId, casinoId, title, description, date, hour, status } = occurrenceSchema.parse(req.body);

            const occurrence = await prisma.occurrence.update({
                where: { id },
                data: {
                    clientId,
                    casinoId,
                    title,
                    description,
                    date,
                    hour,
                    status,
                },
            });
            return res.status(200).json(occurrence);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ 
                    error: "Erro de validação",
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            return res.status(400).json({ error: error.message });
        }
    }
    //delete occurrence 
    async deleteOccurrence(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const occurrence = await prisma.occurrence.delete({
                where: { id },
            });
            return res.status(200).json(occurrence);
        } catch (error) {
            return res.status(500).json({ error: "Failed to delete occurrence" });
        }
    }

    //get attachments from occurrence
    async getAttachments(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const occurrence = await prisma.occurrence.findUnique({
                where: { id },
                include: {
                    occurrences_attachments: true,
                },
            });
            if (!occurrence) {
                return res.status(404).json({ error: "Occurrence not found" });
            }
            return res.status(200).json(occurrence.occurrences_attachments);
        } catch (error) {
            return res.status(500).json({ error: "Failed to fetch attachments" });
        }
    }
    //add attachment to occurrence
    async addAttachment(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const occurrence = await prisma.occurrence.findUnique({
                where: { id },
            });
            if (!occurrence) {
                return res.status(404).json({ error: "Occurrence not found" });
            }
            if (req.files && Array.isArray(req.files)) {
                const attachments = req.files.map((file: Express.Multer.File) => {
                    return {
                        name: file.originalname,
                        type: determineAttachmentType(file.mimetype),
                        url: file.path,
                        occurrenceId: occurrence.id,
                    };
                });
                await prisma.occurrenceAttachment.createMany({
                    data: attachments,
                });
            }
            return res.status(201).json({ message: "Attachments added successfully" });
        } catch (error) {
            return res.status(500).json({ error: "Failed to add attachments" });
        }
    }
    //delete attachment from occurrence
    async deleteAttachment(req: Request, res: Response) {
        try {
            const { id, attachmentId } = req.params;
            const occurrence = await prisma.occurrence.findUnique({
                where: { id },
            });
            if (!occurrence) {
                return res.status(404).json({ error: "Occurrence not found" });
            }
            const attachment = await prisma.occurrenceAttachment.delete({
                where: { id: attachmentId },
            });
            return res.status(200).json(attachment);
        } catch (error) {
            return res.status(500).json({ error: "Failed to delete attachment" });
        }
    }
    //download attachment
    async downloadAttachment(req: Request, res: Response) {
        try {
            const { id, attachmentId } = req.params;
            const occurrence = await prisma.occurrence.findUnique({
                where: { id },
            });
            if (!occurrence) {
                return res.status(404).json({ error: "Occurrence not found" });
            }
            const attachment = await prisma.occurrenceAttachment.findUnique({
                where: { id: attachmentId },
            });
            if (!attachment) {
                return res.status(404).json({ error: "Attachment not found" });
            }
            res.download(attachment.url, attachment.name);
        } catch (error) {
            return res.status(500).json({ error: "Failed to download attachment" });
        }
    }

} export { OccurrencesController }