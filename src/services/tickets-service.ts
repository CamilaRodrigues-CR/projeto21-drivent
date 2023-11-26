import { notFoundError } from "@/errors";
import { CreateTicketParams } from "@/protocols";
import { enrollmentRepository, ticketsRepository } from "@/repositories"

async function getTicketTypes() {
    const ticketTypes = await ticketsRepository.findTicketTypes()
    return ticketTypes;
}

async function getTicketByUserId(userId: number) {
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!enrollment) throw notFoundError();

    const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
    if (!ticket) throw notFoundError();

    return ticket;
}

async function createTicket(userId: number, ticketTypeId: number) {
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!enrollment) throw notFoundError();

    const ticketData: CreateTicketParams = {
        ticketTypeId,
        enrollmentId: enrollment.id,
        status: 'RESERVED'
    }

    const ticket = await ticketsRepository.createTicket(ticketData)
    return ticket
}

export const ticketsService = {
    getTicketByUserId,
    getTicketTypes,
    createTicket
}