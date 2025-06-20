import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { InterdictionStatus, InterdictionType, AttachmentType,InterdictionPeriod } from '@prisma/client'; // Correctly import InterdictionStatus 


function determineAttachmentType(mimetype: string): AttachmentType {
    if (mimetype.includes('pdf')) {
        return 'PDF';
    } else if (mimetype.includes('image')) {
        return 'Image';
    } else {
        return 'Document';
    }
}

//interdiction schema
const interdictionSchema = z.object({
    clientId: z.string().min(1, 'Client ID is required'),
    casinoId: z.string().min(1, 'Casino ID is required'),
    type: z.enum([InterdictionType.administrativa, InterdictionType.judicial, InterdictionType.voluntaria], { required_error: 'Type is required' }),
    reason: z.string().min(1, 'Reason is required'),
    period: z.enum([InterdictionPeriod.seis_meses, InterdictionPeriod.um_ano, InterdictionPeriod.dois_anos, InterdictionPeriod.tres_anos, InterdictionPeriod.cinco_anos, InterdictionPeriod.indefinido], { required_error: 'Period is required' }),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    status: z.enum([InterdictionStatus.aprovada, InterdictionStatus.pendente, InterdictionStatus.rejeitada], { required_error: 'Status is required' }).default(InterdictionStatus.pendente),
});






class InterdictionsController {


    //create interdiction
    async createInterdiction(req: Request, res: Response) {
        try {
            const {
                 clientId,
                casinoId,
                type,
                reason,
                period,
                startDate,
                endDate, 
                status
            } = interdictionSchema.parse(req.body);


            const userId = req.user?.id;

            if(!userId) {
                return res.status(401).json({ error: 'User ID is required' });
            }
            // Check if the casino exists
            const casino = await prisma.casino.findUnique({
                where: { id: casinoId },
            });
            if (!casino) {
                return res.status(404).json({ error: 'Casino not found' });
            }
            // Check if the client exists   
            const client = await prisma.client.findUnique({
                where: { id: clientId },
            });
            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }
            // Check if the client already has an interdiction
            const existingInterdiction = await prisma.interdiction.findFirst({
                where: {
                    clientId: clientId,
                    casinoId: casinoId,
                },
            });
            if (existingInterdiction) {
                return res.status(409).json({ error: 'Client already has an interdiction' });
            }

            // Create the interdiction          
            const interdiction = await prisma.interdiction.create({
                data: {
                    clientId,
                    casinoId,
                    type,
                    reason,
                    period,
                    startDate: startDate ? new Date(startDate).toISOString() : null,
                    endDate: endDate ? new Date(endDate).toISOString() : null,
                    status,
                    userId// Set the user ID who created the interdiction
                },
                include: {
                    client:{
                        select:{
                            id:true,
                            name:true,
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
                },

                  interdictions_attachments: {
                    select: {   
                        id: true,
                        name: true,
                        type: true,
                       
                    },
                }
            }
           })

       //handle file uploads if any
            if (req.files && Array.isArray(req.files)) {
                const attachments = req.files.map((file) => {
                    return {
                        name: file.originalname,
                        type: determineAttachmentType(file.mimetype),
                        url: file.path,
                        interdictionId: interdiction.id,
                    };
                });
                await prisma.interdictionAttachment.createMany({
                    data: attachments,
                });
            }
            res.status(201).json(interdiction);
      


        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ error: error.errors });
            }
            else if (error instanceof Error) {
                res.status(500).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Failed to create interdiction' });
            }
        }

    }


    //get interdictions
    async getInterdictions(req: Request, res: Response) { 
        try {
            //Pega page e pageSize dos query params, com valores padrão
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 10;
            const skip = (page - 1) * pageSize;
            const take = pageSize;

            //Busca interdições paginadas
            const [interdictions, total] = await Promise.all([
                prisma.interdiction.findMany({
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
                    },
                    interdictions_attachments: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        },
                    },
                },
                    
                }),
                prisma.interdiction.count(),
            ]);

            res.status(200).json({
                data: interdictions,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / pageSize),
                },
            });

         
           
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch interdictions' });
        }
    }

    //get interdiction by id
    async getInterdictionById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const interdiction = await prisma.interdiction.findUnique({
                where: { id },
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
                    },
                    interdictions_attachments: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        },
                    },
                },
            });
            if (!interdiction) {
                return res.status(404).json({ error: 'Interdiction not found' });
            }
            res.status(200).json(interdiction);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch interdiction' });
        }
    }

    //update interdiction
    async updateInterdiction(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                clientId,
                casinoId,
                type,
                reason,
                period,
                startDate,
                endDate,
                status
            } = interdictionSchema.parse(req.body);

            const userId = req.user?.id;

            if(!userId) {
                return res.status(401).json({ error: 'User ID is required' });
            }

            // Check if the casino exists
            const casino = await prisma.casino.findUnique({
                where: { id: casinoId },
            });
            if (!casino) {
                return res.status(404).json({ error: 'Casino not found' });
            }
            // Check if the client exists   
            const client = await prisma.client.findUnique({
                where: { id: clientId },
            });
            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }

            // Update the interdiction
            const updatedInterdiction = await prisma.interdiction.update({
                where: { id },
                data: {
                    clientId,
                    casinoId,
                    type,
                    reason,
                    period,
                    startDate: startDate ? new Date(startDate).toISOString() : undefined,
                    endDate: endDate ? new Date(endDate).toISOString() : undefined,
                    status,
                    userId// Set the user ID who created the interdiction
                },
                include: {
                    client:{
                        select:{
                            id:true,
                            name:true,
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
                },

                  interdictions_attachments: {
                    select: {   
                        id: true,
                        name: true,
                        type: true,
                       
                    },
                }
            }
           })

       //handle file uploads if any
            if (req.files && Array.isArray(req.files)) {
                const attachments = req.files.map((file) => {
                    return {
                        name: file.originalname,
                        type: determineAttachmentType(file.mimetype),
                        url: file.path,
                        interdictionId: updatedInterdiction.id,
                    };
                });

            }
            res.status(200).json(updatedInterdiction);
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ error: error.errors });
            }
            else if (error instanceof Error) {
                res.status(500).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Failed to update interdiction' });
            }       
        }   
    }

    //delete interdiction
    async deleteInterdiction(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await prisma.interdiction.delete({
                where: { id },
            });
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete interdiction' });
        }
    }

    //add attachment to interdiction
    async addAttachment(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const files = req.files as Express.Multer.File[]; // Cast to the correct type

            if (!files || files.length === 0) {
                return res.status(400).json({ error: 'No files uploaded' });
            }

            const attachments = files.map((file) => ({
                name: file.originalname,
                type: determineAttachmentType(file.mimetype),
                url: file.path,
                interdictionId: id,
            }));

            await prisma.interdictionAttachment.createMany({
                data: attachments,
            });

            res.status(201).json({ message: 'Attachments added successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to add attachments' });
        }
    }
    //delete attachment from interdiction
    async deleteAttachment(req: Request, res: Response) {
        try {
            const { id, attachmentId } = req.params;
            await prisma.interdictionAttachment.delete({
                where: { id: attachmentId },
            });
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete attachment' });
        }
    }

    //get attachments from interdiction
    async getAttachments(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const attachments = await prisma.interdictionAttachment.findMany({
                where: { interdictionId: id },
            });
            res.status(200).json(attachments);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch attachments' });
        }
    }        

    //download attachment from interdiction
    async downloadAttachment(req: Request, res: Response) {
        try {
            const { id, attachmentId } = req.params;
            const attachment = await prisma.interdictionAttachment.findUnique({
                where: { id: attachmentId },
            });
            if (!attachment) {
                return res.status(404).json({ error: 'Attachment not found' });
            }
            res.download(attachment.url, attachment.name || 'download');
        } catch (error) {
            res.status(500).json({ error: 'Failed to download attachment' });
        }
    }
  //function to aprove interdiction
    async approveInterdiction(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updatedInterdiction = await prisma.interdiction.update({
                where: { id },
                data: { status: InterdictionStatus.aprovada },
            });
            res.status(200).json(updatedInterdiction);
        } catch (error) {
            res.status(500).json({ error: 'Failed to approve interdiction' });
        }
    }
    //function to reject interdiction and set status to rejected    
    async rejectInterdiction(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updatedInterdiction = await prisma.interdiction.update({
                where: { id },
                data: { status: InterdictionStatus.rejeitada },
            });
            res.status(200).json(updatedInterdiction);
        } catch (error) {
            res.status(500).json({ error: 'Failed to reject interdiction' });
        }
    }
  
    
}

export { InterdictionsController }