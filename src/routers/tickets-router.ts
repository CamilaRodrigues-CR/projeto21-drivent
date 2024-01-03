import { createTicket, getTicket, getTicketTypes } from "@/controllers";
import { authenticateToken, validateBody } from "@/middlewares";
import { createTicketSchema } from "@/schemas";
import { Router } from "express";

const ticketsRouter = Router();

ticketsRouter
    .all('/*', authenticateToken)
    .get('/types', getTicketTypes)
    .get('/', getTicket)
    .post('/', validateBody(createTicketSchema), createTicket);

export { ticketsRouter }