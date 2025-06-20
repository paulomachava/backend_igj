import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';
import { CasinoLocation } from "@prisma/client"
import { z } from 'zod'

// Define Zod schemas
const casinoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contact: z.string().optional(),
  email: z.string().email('email invalido').optional(),
  location: z.enum([CasinoLocation.Maputo, CasinoLocation.Matola, CasinoLocation.Gaza,
  CasinoLocation.Inhambane, CasinoLocation.Beira, CasinoLocation.Manica, CasinoLocation.Zambezia,
  CasinoLocation.Tete, CasinoLocation.Nampula, CasinoLocation.Niassa, CasinoLocation.Pemba
  ], { required_error: 'Location is required' }),
  adress: z.string().min(1, 'Adress is required'),
  foundedIn: z.string().or(z.date()),
  licenseNr: z.string().min(1, 'License number is required'),
  licenseValidity: z.string().or(z.date()),
});

/**
 * CasinoController handles operations related to casinos.
 *
 * This controller provides methods to:
 * - Retrieve all casinos.
 * - Retrieve a single casino by ID.
 * - Create a new casino.
 * - Update an existing casino.
 * - Delete a casino.
 */
export class CasinoController {

  /**
   * Retrieves all casinos from the database.
   *
   * @param {Request} req - The HTTP request object.
   * @param {Response} res - The HTTP response object.
   * @returns {Response} - Returns a list of all casinos.
   */
  async getCasinos (req: Request, res: Response) {
    try {
      // Pega page e pageSize dos query params, com valores padrão
      
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const skip = (page - 1) * pageSize;
      const take = pageSize;

      // Busca cassinos paginados
      const [casinos, total] = await Promise.all([
        prisma.casino.findMany({
          skip,
          take,
        }),
        prisma.casino.count(),
      ]);

      res.status(200).json({
        data: casinos,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / pageSize),
          totalItems: total,
          pageSize,
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch casinos' });
    }
  };

  /**
   * Retrieves a single casino by its ID.
   *
   * @param {Request} req - The HTTP request object.
   * @param {Response} res - The HTTP response object.
   * @returns {Response} - Returns the casino data or an error if not found.
   */
  getCasinoById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const casino = await prisma.casino.findUnique({ where: { id } });
      if (!casino) {
        return res.status(404).json({ error: 'Casino not found' });
      }
      res.status(200).json(casino);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch casino' });
    }
  };

  /**
   * Creates a new casino.
   *
   * Validates the request body, ensures the authenticated user's ID is included,
   * and checks for duplicate casinos before creating a new record.
   *
   * @param {Request} req - The HTTP request object.
   * @param {Response} res - The HTTP response object.
   * @returns {Response} - Returns the created casino or an error message.
   */
   createCasino = async (req: Request, res: Response) => {
    try {
      const {
        name,
        contact,
        email,
        location,
        adress,
        foundedIn,
        licenseNr,
        licenseValidity
      } = casinoSchema.parse(req.body); // Removed userId from schema parsing

      const userId = req.user?.id; // Retrieve the authenticated user's ID from the request object

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      // Check if the casino already exists
      const existingCasino = await prisma.casino.findFirst({
        where: { name },
      });
      if (existingCasino) {
        return res.status(409).json({ error: 'Casino already exists' });
      }

      const casino = await prisma.casino.create({
        data: {
          name,
          contact,
          email,
          location,
          adress,
          foundedIn: new Date(foundedIn).toISOString(), // Ensure date is in ISO format
          licenseNr,
          licenseValidity: new Date(licenseValidity).toISOString(), // Ensure date is in ISO format
          userId // Add userId programmatically
        },
      });
      res.status(201).json(casino);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error creating casino:', error); // Log the error for debugging
        res.status(500).json({ error: 'Failed to create casino' });
      }
    }
  };

  /**
   * Updates an existing casino by its ID.
   *
   * Validates the request body and updates the specified casino record.
   *
   * @param {Request} req - The HTTP request object.
   * @param {Response} res - The HTTP response object.
   * @returns {Response} - Returns the updated casino or an error message.
   */
  updateCasino = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      // First, check if the casino exists
      const existingCasino = await prisma.casino.findUnique({
        where: { id }
      });

      if (!existingCasino) {
        return res.status(404).json({ error: 'Casino não encontrado' });
      }

      // Validate the request body
      const { 
        name,
        contact,
        email,
        location,
        adress,
        foundedIn,
        licenseNr,
        licenseValidity 
      } = casinoSchema.parse(req.body);

      // Check if another casino with the same name exists (excluding current casino)
      if (name !== existingCasino.name) {
        const duplicateCasino = await prisma.casino.findFirst({
          where: { 
            name,
            id: { not: id } // Exclude current casino from the check
          },
        });
        
        if (duplicateCasino) {
          return res.status(409).json({ error: 'Já existe um casino com este nome' });
        }
      }

      // Update the casino
      const updatedCasino = await prisma.casino.update({
        where: { id },
        data: {
          name,
          contact,
          email,
          location,
          adress,
          foundedIn: new Date(foundedIn).toISOString(), // Ensure date is in ISO format
          licenseNr,
          licenseValidity: new Date(licenseValidity).toISOString(), // Ensure date is in ISO format
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      console.log(`Successfully updated casino ${id}`);
      res.status(200).json(updatedCasino);
    } catch (error) {
      console.error('Error updating casino:', error);
      
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ 
          error: 'Dados inválidos',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      // Handle specific Prisma errors
      if (error instanceof Error) {
        if (error.message.includes('Invalid date')) {
          return res.status(400).json({ 
            error: 'Data inválida fornecida',
            details: error.message 
          });
        }
        if (error.message.includes('Record to update not found')) {
          return res.status(404).json({ error: 'Casino não encontrado' });
        }
        if (error.message.includes('Unique constraint')) {
          return res.status(409).json({ 
            error: 'Violação de restrição única',
            details: 'Um casino com estes dados já existe'
          });
        }
      }
      
      res.status(500).json({ 
        error: 'Falha ao atualizar casino',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  /**
   * Deletes a casino by its ID.
   * 
   * Prevents deletion if there are clients, transactions, interdictions, 
   * occurrences, or taxes associated with the casino.
   *
   * @param {Request} req - The HTTP request object.
   * @param {Response} res - The HTTP response object.
   * @returns {Response} - Returns a success message or an error if deletion fails.
   */
  deleteCasino = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      // First, check if the casino exists and get all related records
      const existingCasino = await prisma.casino.findUnique({
        where: { id },
        include: {
          clients: true,
          transactions: true,
          interdictions: true,
          occurrences: true,
          SpecialTax: true,
          StampTax: true,
        }
      });

      if (!existingCasino) {
        return res.status(404).json({ error: 'Casino not found' });
      }

      // Check if there are any related records that would prevent deletion
      const relatedRecords = {
        clients: existingCasino.clients.length,
        transactions: existingCasino.transactions.length,
        interdictions: existingCasino.interdictions.length,
        occurrences: existingCasino.occurrences.length,
        specialTaxes: existingCasino.SpecialTax.length,
        stampTaxes: existingCasino.StampTax.length,
      };

      console.log(`Attempting to delete casino ${id} with related records:`, relatedRecords);

      // If there are any related records, prevent deletion
      const hasRelatedRecords = Object.values(relatedRecords).some(count => count > 0);
      
      if (hasRelatedRecords) {
        const relatedRecordsDetails = [];
        if (relatedRecords.clients > 0) relatedRecordsDetails.push(`${relatedRecords.clients} cliente(s)`);
        if (relatedRecords.transactions > 0) relatedRecordsDetails.push(`${relatedRecords.transactions} transação(ões)`);
        if (relatedRecords.interdictions > 0) relatedRecordsDetails.push(`${relatedRecords.interdictions} interdição(ões)`);
        if (relatedRecords.occurrences > 0) relatedRecordsDetails.push(`${relatedRecords.occurrences} ocorrência(s)`);
        if (relatedRecords.specialTaxes > 0) relatedRecordsDetails.push(`${relatedRecords.specialTaxes} taxa(s) especial(is)`);
        if (relatedRecords.stampTaxes > 0) relatedRecordsDetails.push(`${relatedRecords.stampTaxes} taxa(s) de selo`);

        return res.status(409).json({
          error: 'Não é possível excluir o casino',
          message: `Este casino possui registros associados: ${relatedRecordsDetails.join(', ')}. ` +
                   'Por favor, remova ou reassocie estes registros antes de excluir o casino.',
          relatedRecords: relatedRecords
        });
      }

      // If no related records, proceed with deletion
      await prisma.casino.delete({ where: { id } });
      
      console.log(`Successfully deleted casino ${id}`);
      res.status(200).json({ 
        message: 'Casino excluído com sucesso',
        deletedCasino: {
          id: existingCasino.id,
          name: existingCasino.name
        }
      });
    } catch (error) {
      console.error('Error deleting casino:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Foreign key constraint')) {
          return res.status(409).json({ 
            error: 'Não é possível excluir o casino devido a registros relacionados',
            details: error.message 
          });
        }
        if (error.message.includes('Record to delete does not exist')) {
          return res.status(404).json({ error: 'Casino não encontrado' });
        }
      }
      
      res.status(500).json({ 
        error: 'Falha ao excluir casino',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}

