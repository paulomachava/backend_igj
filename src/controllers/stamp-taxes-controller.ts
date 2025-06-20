import { Request, Response } from 'express';
import {z} from "zod"
import {prisma} from "../lib/prisma"

//const stamp tax schema

 const stampTaxSchema = z.object({
    casinoId: z.string().uuid(),
    ticketsSold:z.number().positive("Numero de bilhetes vendidos deve ser maior ou igual a zero"),
    date: z.string().regex(/^\d{1,2}\/\d{1,2}\/\d{4}$/, "Data deve estar no formato dd/mm/yyyy"),
 })



class StampTaxesController { 
   //new stamp tax
   async createStampTax(req: Request, res: Response) {
      try{
         const{casinoId, ticketsSold, date} = stampTaxSchema.parse(req.body)
         
         const userId = req.user?.id
         if(!userId){
            return res.status(401).json({message: "Unauthorized"})
         }
         //check if casinoId is existent in the database
         const casino = await prisma.casino.findUnique({
            where:{
               id: casinoId,
            }
         })
         if(!casino){
            return res.status(404).json({message: "Casino not found"})
         }
         if (new Date(date) > new Date()) {
            return res.status(400).json({ error: "Date cannot be in the future" });
        }

         //create stamp tax
         const stampTax = await prisma.stampTax.create({
            data:{
               casinoId,
               ticketsSold,
               date: new Date(date),
               userId
            }
         })
         return res.status(201).json(stampTax)

      }catch(err){
         if(err instanceof z.ZodError){
            return res.status(400).json({message: err.errors})
         }
         return res.status(500).json({message: "Internal server error"})
      }


   }
   //get all stamp taxes and filter by casinoId and date range using query params (req.query)

  async getStampTaxes(req: Request, res: Response) {
      try{

           //Pega page e pageSize dos query params, com valores padrão
         const page = parseInt(req.query.page as string) || 1;
         const pageSize = parseInt(req.query.pageSize as string) || 10;
         const skip = (page - 1) * pageSize;
         const take = pageSize;

         // buscar s
         
         const [stampTaxes,total] = await Promise.all([
          prisma.stampTax.findMany({
           skip,
           take,
            include:{
               casino:true,
               user:true
            },
            orderBy: {
               date: "desc",
             },
         }),
         prisma.stampTax.count()
      ])
         return res.status(200).json({
            data:stampTaxes,
            pagination:{
               currentPage: page,
               totalPages:Math.ceil(total / pageSize),
            }
         })
      }catch(error){
         return res.status(500).json({message: "Internal server error"})
      }
   }

   //get stamp tax by id
   async getStampTaxById(req: Request, res: Response) {
      try{
         const {id} = req.params
         const stampTax = await prisma.stampTax.findUnique({
            where:{
               id,
            },
            include:{
               casino:true,
               user:true
            }
         })
         if(!stampTax){
            return res.status(404).json({message: "Stamp tax not found"})
         }
         return res.status(200).json(stampTax)
      }catch(err){
         return res.status(500).json({message: "Internal server error"})
      }
   }

   //update stamp tax
   async updateStampTax(req: Request, res: Response) {
      try{
         const {id} = req.params
         const {casinoId, ticketsSold, date} = stampTaxSchema.parse(req.body)
         const userId = req.user?.id
         if(!userId){
            return res.status(401).json({message: "Unauthorized"})
         }
         //check if casinoId is existent in the database
         const casino = await prisma.casino.findUnique({
            where:{
               id: casinoId,
            }
         })
         if(!casino){
            return res.status(404).json({message: "Casino not found"})
         }
         if (new Date(date) > new Date()) {
            return res.status(400).json({ error: "Date cannot be in the future" });
        }

         //update stamp tax
         const stampTax = await prisma.stampTax.update({
            where:{
               id,
            },
            data:{
               casinoId,
               ticketsSold,
               date: new Date(date),
               userId
            }
         })
         return res.status(200).json(stampTax)

      }catch(err){
         if(err instanceof z.ZodError){
            return res.status(400).json({message: err.errors})
         }
         return res.status(500).json({message: "Internal server error"})
      }


   }
//delete stamp tax

   async deleteStampTax(req: Request, res: Response) {
      try{
         const {id} = req.params
         const stampTax = await prisma.stampTax.findUnique({
            where:{
               id,
            }
         })
         if(!stampTax){
            return res.status(404).json({message: "Stamp tax not found"})
         }
         await prisma.stampTax.delete({
            where:{
               id,
            }
         })
         return res.status(200).json({message: "Stamp tax deleted"})
      }catch(err){
         return res.status(500).json({message: "Internal server error"})
      }
    
   }
 //get stamp tax by casinoId
   async getStampTaxByCasinoId(req: Request, res: Response) {
      try{
         const {casinoId} = req.params
         const stampTaxes = await prisma.stampTax.findMany({
            where:{
               casinoId,
            },
            include:{
               casino:true,
               user:true
            }
         })
         if(!stampTaxes){
            return res.status(404).json({message: "Stamp tax not found"})
         }
         return res.status(200).json(stampTaxes)
      }catch(err){
         return res.status(500).json({message: "Internal server error"})
      }
   }
 
   //get stamp tax by casinoId date range using query params (req.query)
   async getStampTaxesByCasinoIdAndDateRange(req: Request, res: Response) {
      try {
          const { casinoId, startDate, endDate } = req.query;
  
          // Validate required query parameters
          if (!casinoId || !startDate || !endDate) {
              return res.status(400).json({ message: "Missing required fields: casinoId, startDate, or endDate" });
          }
  
          // Validate date format
          const start = new Date(String(startDate));
          const end = new Date(String(endDate));
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
              return res.status(400).json({ message: "Invalid date format" });
          }
  
          // Fetch stamp taxes within the date range for the given casinoId
          const stampTaxes = await prisma.stampTax.findMany({
              where: {
                  casinoId: String(casinoId),
                  date: {
                      gte: start,
                      lte: end,
                  },
              },
              include: {
                  casino: true,
                  user: true,
              },
          });
  
          // Check if any stamp taxes were found
          if (stampTaxes.length === 0) {
              return res.status(404).json({ message: "No stamp taxes found for the given criteria" });
          }
  
          return res.status(200).json(stampTaxes);
      } catch (err) {
          return res.status(500).json({ message: "Internal server error" });
      }
  }



} export{ StampTaxesController }