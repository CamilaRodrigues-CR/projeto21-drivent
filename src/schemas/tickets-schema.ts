import { InputTicketBody } from "@/protocols";
import Joi from "joi";

export const createTicketSchema = Joi.object<InputTicketBody>({
    ticketTypeId: Joi.number().integer().min(1).required()
})