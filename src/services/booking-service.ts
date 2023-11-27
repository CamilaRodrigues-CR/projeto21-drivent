import { forbiddenBookingError, notFoundError } from "@/errors";
import { CreateBookingParams } from "@/protocols";
import { enrollmentRepository, ticketsRepository } from "@/repositories";
import { bookingRepository } from "@/repositories/booking-repository";
import { TicketStatus } from "@prisma/client";


async function validateBooking(userId: number, roomId: number) {
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!enrollment) throw notFoundError();

    const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
    if (!ticket) throw notFoundError();

    const type = ticket.TicketType;

    if (ticket.status === TicketStatus.RESERVED || type.isRemote || !type.includesHotel) throw forbiddenBookingError();

    const room = await bookingRepository.findRoom(roomId);
    if ( !room ) throw notFoundError()
    if (room.capacity < 1) throw forbiddenBookingError();
}

async function validateUpdateBooking(userId: number, roomId: number){
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!enrollment) throw notFoundError();

    const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
    if (!ticket) throw notFoundError();

    const type = ticket.TicketType;

    if (ticket.status === TicketStatus.RESERVED || type.isRemote || !type.includesHotel) throw forbiddenBookingError();
    
    const reservation = await bookingRepository.findBooking(userId);
    if ( !reservation ) throw forbiddenBookingError();
   
    const room = await bookingRepository.findRoom(roomId);
    if( room.capacity < 1 ) throw forbiddenBookingError();
    
    await bookingRepository.incrementCapacityRoom(reservation.roomId);

    await bookingRepository.decrementCapacityRoom(roomId);
}


async function getBooking(userId: number) {
    const booking = await bookingRepository.findBooking(userId)
    if( !booking ) throw notFoundError();

    return booking
}


async function postBooking(userId: number, roomId: number) {
    await validateBooking(userId, roomId);

    const bookingData: CreateBookingParams = {
        userId,
        roomId
    }

    await bookingRepository.decrementCapacityRoom(roomId);

    const booking = await bookingRepository.createBooking(bookingData)

    return booking
}


async function putBooking(userId: number, bookingId: number, roomId: number ) {
    await validateUpdateBooking(userId, roomId);

    const updateBooking = await bookingRepository.updateBooking(bookingId, roomId);

    return updateBooking;
}

export const bookingService = {
    getBooking,
    postBooking,
    putBooking,
    validateBooking,
    validateUpdateBooking
}