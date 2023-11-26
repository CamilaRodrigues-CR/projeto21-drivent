import { prisma } from '@/config';
import { CreateTicketParams } from '@/protocols';
import { Ticket, TicketStatus, TicketType } from '@prisma/client';

async function findTicketTypes(): Promise<TicketType[]> {
    const result = await prisma.ticketType.findMany();
    return result
}

async function findTicketByEnrollmentId(enrollmentId: number) {
    const result = await prisma.ticket.findUnique({
        where: { enrollmentId },
        include: { TicketType: true }
    })
    return result
}

async function findTicketById(ticketId: number) {
    const result = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { TicketType: true },
    });
  
    return result;
  }
  
  async function ticketProcessPayment(ticketId: number) {
    const result = prisma.ticket.update({
      where: {
        id: ticketId,
      },
      data: {
        status: TicketStatus.PAID,
      },
    });
  
    return result;
  }

async function createTicket(ticket: CreateTicketParams) {
    const result = await prisma.ticket.create({
        data: ticket,
        include: { TicketType: true }
    })
    return result
}

export const ticketsRepository = {
    findTicketTypes,
    findTicketByEnrollmentId,
    createTicket,
    findTicketById,
    ticketProcessPayment,
}