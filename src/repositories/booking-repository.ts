import { prisma } from "@/config";
import { CreateBookingParams } from "@/protocols";

async function findRoom(roomId: number){
    const result = await prisma.room.findUnique({
        where:{ id: roomId }
    })
    return result;
}

async function decrementCapacityRoom(roomId: number){
    const result = await prisma.room.update({
        where: {
            id: roomId,
          },
          data: {
            capacity: {
              decrement: 1,
            },
          },
    })
}
async function incrementCapacityRoom(roomId: number){
    const result = await prisma.room.update({
        where: {
            id: roomId,
          },
          data: {
            capacity: {
              increment: 1,
            },
          },
    })
}

async function findBooking(userId: number){
    const result = await prisma.booking.findFirst({
        where: { userId },
        include: {Room : true}
    })
    return result
}

async function createBooking( booking: CreateBookingParams){
    const result = await prisma.booking.create({
        data: booking
    })
    return result;
}

async function updateBooking(bookingId: number, roomId: number ) {
    const result = await prisma.booking.update({
        where: {
            id: bookingId,
          },
          data: {
            roomId: roomId
          },
    })
    return result;
}


export const bookingRepository = {
    findRoom,
    decrementCapacityRoom,
    incrementCapacityRoom,
    findBooking,
    createBooking,
    updateBooking
}