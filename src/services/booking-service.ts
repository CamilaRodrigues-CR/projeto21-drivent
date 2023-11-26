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

    if (ticket.status === TicketStatus.RESERVED || type.isRemote || !type.includesHotel) {
        throw forbiddenBookingError();
    }

    const room = await bookingRepository.findRoom(roomId);
    if ( !room ) throw notFoundError()
    if( room.capacity <= 0 ) throw forbiddenBookingError()
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
   
    await validateBooking(userId, roomId);

    const reservation = await getBooking(userId);

    await bookingRepository.incrementCapacityRoom(reservation.roomId);
    await bookingRepository.decrementCapacityRoom(roomId)

    const updateBooking = await bookingRepository.updateBooking(bookingId, roomId);

    return updateBooking;

    /*
        lógica: vou receber o id da reserva e devo alterar o id do room. Ao fazer isso devo incrementar o valor da capacidade do quarto antigo e decrementar o valor do quarto novo!

    - A troca pode ser efetuada para usuários que possuem reservas.
    - A troca pode ser efetuada apenas para quartos livres.
    - `roomId` não existente ⇒ deve retornar status code `404 (Not Found)`.  => OK
    - `roomId` sem reserva ⇒ deve retornar status code `403 (Forbidden)`.  => 
    - `roomId` sem vaga no novo quarto ⇒ deve retornar status code `403 (Forbidden)`. => OK
    - Fora da regra de negócio ⇒ deve retornar status code `403 (Forbidden)`.
    */
}




export const bookingService = {
    getBooking,
    postBooking,
    putBooking
}