import {z} from "zod";
import { prisma } from "../lib/prisma";
import { Request, Response } from "express";

// Helper function to convert date string to Date object (supports both dd/mm/yyyy and yyyy-mm-dd)
function parseDate(dateString: string): Date {
    if (!dateString) {
        throw new Error("Date string is required");
    }
    
    let day: number, month: number, year: number;
    
    // Check if it's ISO format (yyyy-mm-dd)
    if (dateString.includes('-')) {
        const [yearStr, monthStr, dayStr] = dateString.split('-');
        
        if (!yearStr || !monthStr || !dayStr) {
            throw new Error("Invalid date format. Expected yyyy-mm-dd or dd/mm/yyyy");
        }
        
        year = parseInt(yearStr);
        month = parseInt(monthStr);
        day = parseInt(dayStr);
    } 
    // Brazilian format (dd/mm/yyyy)
    else if (dateString.includes('/')) {
        const [dayStr, monthStr, yearStr] = dateString.split('/');
        
        if (!dayStr || !monthStr || !yearStr) {
            throw new Error("Invalid date format. Expected dd/mm/yyyy or yyyy-mm-dd");
        }
        
        day = parseInt(dayStr);
        month = parseInt(monthStr);
        year = parseInt(yearStr);
    } else {
        throw new Error("Invalid date format. Expected dd/mm/yyyy or yyyy-mm-dd");
    }
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        throw new Error("Invalid date values");
    }
    
    const date = new Date(year, month - 1, day);
    
    // Verify that the date is valid (handles cases like 31/02/2024)
    if (date.getFullYear() !== year || 
        date.getMonth() !== month - 1 || 
        date.getDate() !== day) {
        throw new Error("Invalid date");
    }
    
    return date;
}

// Helper function to validate date format (supports both formats)
function isValidDateFormat(dateString: string): boolean {
    const brazilianDateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    const isoDateRegex = /^\d{4}-\d{1,2}-\d{1,2}$/;
    return brazilianDateRegex.test(dateString) || isoDateRegex.test(dateString);
}

//schema for special tax
const specialTaxSchema = z.object({
    casinoId: z.string().uuid(),
    tableResult: z.string(),
    machineResult: z.string(),
    date: z.string().regex(/^\d{1,2}\/\d{1,2}\/\d{4}$/, "Data deve estar no formato dd/mm/yyyy"),
});

class SpecialTaxesController {

    //create new special tax
    async createSpecialTax(req: Request, res: Response) {
        try {
            const { casinoId, tableResult, machineResult, date } = specialTaxSchema.parse(req.body);
            const userId = req.user?.id; // Get the userId from the request object
            
            // Check if the user is authenticated
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            // Convert date string to Date object
            const parsedDate = parseDate(date);
            
            // Check if the casino exists
            const casino = await prisma.casino.findUnique({
                where: { id: casinoId },
            });
            if (!casino) {
                return res.status(404).json({ error: "Casino not found" });
            }
            
            // Cannot create special tax if date is bigger than today
            const today = new Date();
            today.setHours(23, 59, 59, 999); // Set to end of today
            if (parsedDate > today) {
                return res.status(400).json({ error: "Date cannot be in the future" });
            }

            // Check if the special tax already exists for the given date and casino
            const startOfDay = new Date(parsedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(parsedDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            const existingSpecialTax = await prisma.specialTax.findFirst({
                where: {
                    casinoId,
                    date: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            });
            
            if (existingSpecialTax) {
                return res.status(400).json({ error: "Special tax already exists for this date and casino" });
            }
            
            // Create special tax    
            const specialTax = await prisma.specialTax.create({
                data: {
                    casinoId,
                    tableResult: parseFloat(tableResult),
                    machineResult: parseFloat(machineResult),
                    date: parsedDate,
                    userId, // Include the userId in the data object
                },
                include: {
                    casino: {
                        select: {
                            id: true,
                            name: true,
                        }, // Include the related casino data
                    },
                },
            });
            return res.status(201).json(specialTax);
        } catch (error) {
            console.error("Error creating special tax:", error);
            
            // Handle Zod validation errors
            if (error instanceof z.ZodError) {
                return res.status(400).json({ 
                    error: "Validation error", 
                    details: error.errors 
                });
            }
            
            // Handle Prisma errors
            if (error && typeof error === 'object' && 'code' in error) {
                const prismaError = error as any;
                if (prismaError.code === 'P2002') {
                    return res.status(400).json({ error: "Duplicate entry" });
                }
                if (prismaError.code === 'P2025') {
                    return res.status(404).json({ error: "Record not found" });
                }
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }   
    }

//get all special taxes
async getSpecialTaxes(req: Request, res: Response) {
    try {
        // Pega page e pageSize dos query params, com valores padrão
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const skip = (page - 1) * pageSize;
        const take = pageSize;
        
        // Pega os filtros dos query params
        const casinoId = req.query.casinoId as string;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        
        // Constrói o objeto where dinamicamente baseado nos filtros
        const whereClause: any = {};
        
        // Filtro por casino
        if (casinoId) {
            whereClause.casinoId = casinoId;
        }
        
        // Filtros por data
        if (startDate || endDate) {
            whereClause.date = {};
            
            if (startDate) {
                // Valida o formato da data
                if (!isValidDateFormat(startDate)) {
                    return res.status(400).json({ 
                        error: "Invalid startDate format. Expected dd/mm/yyyy or yyyy-mm-dd" 
                    });
                }
                
                try {
                    // Converte startDate para o início do dia
                    const parsedStartDate = parseDate(startDate);
                    parsedStartDate.setHours(0, 0, 0, 0);
                    whereClause.date.gte = parsedStartDate;
                } catch (error) {
                    return res.status(400).json({ 
                        error: `Invalid startDate: ${error instanceof Error ? error.message : 'Unknown error'}` 
                    });
                }
            }
            
            if (endDate) {
                // Valida o formato da data
                if (!isValidDateFormat(endDate)) {
                    return res.status(400).json({ 
                        error: "Invalid endDate format. Expected dd/mm/yyyy or yyyy-mm-dd" 
                    });
                }
                
                try {
                    // Converte endDate para o final do dia
                    const parsedEndDate = parseDate(endDate);
                    parsedEndDate.setHours(23, 59, 59, 999);
                    whereClause.date.lte = parsedEndDate;
                } catch (error) {
                    return res.status(400).json({ 
                        error: `Invalid endDate: ${error instanceof Error ? error.message : 'Unknown error'}` 
                    });
                }
            }
        }
        
        const [specialTaxes, total] = await Promise.all([
            prisma.specialTax.findMany({
                where: whereClause,
                skip,
                take,
                include: {
                    casino: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                    user: true
                },
                orderBy: {
                    date: "desc",
                },
            }),
            prisma.specialTax.count({
                where: whereClause,
            })
        ]);
                   
        return res.status(200).json({
            data: specialTaxes,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / pageSize),
                totalItems: total,
            }
        });
    } catch (error) {
        console.error("Error getting special taxes:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

//get special tax by id
async getSpecialTaxById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const specialTax = await prisma.specialTax.findUnique({
            where: { id },
            include: {
                casino:{
                    select:{
                        id:true,
                        name:true,
                    }
                },
            },
        });
        if (!specialTax) {
            return res.status(404).json({ error: "Special tax not found" });
        }
        return res.status(200).json(specialTax);
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }

}
//update special tax
async updateSpecialTax(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { casinoId, tableResult, machineResult, date } = specialTaxSchema.parse(req.body);
        
        // Convert date string to Date object
        const parsedDate = parseDate(date);
        
        const specialTax = await prisma.specialTax.update({
            where: { id },
            data: {
                casinoId,
                tableResult: parseFloat(tableResult),
                machineResult: parseFloat(machineResult),
                date: parsedDate,
            },
            include: {
                casino: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
            },
        });
        return res.status(200).json(specialTax);
    } catch (error) {
        console.error("Error updating special tax:", error);
        
        // Handle Zod validation errors
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: "Validation error", 
                details: error.errors 
            });
        }
        
        // Handle Prisma errors
        if (error && typeof error === 'object' && 'code' in error) {
            const prismaError = error as any;
            if (prismaError.code === 'P2025') {
                return res.status(404).json({ error: "Special tax not found" });
            }
        }
        
        return res.status(500).json({ error: "Internal server error" });
    }
}

//delete special taxes
async deleteSpecialTax(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const specialTax = await prisma.specialTax.delete({
            where: { id },
        });
        return res.status(200).json(specialTax);
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}




}
export{ SpecialTaxesController }