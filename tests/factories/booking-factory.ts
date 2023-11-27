import { prisma } from "@/config";
import faker from "@faker-js/faker";

export async function createBooking(userId: number, roomId: number) {
    return prisma.booking.create({
        data: {
            userId,
            roomId,
        }
    })
}

export async function createForbiddenRoom(hotelId: number) {
    return prisma.room.create({
        data: {
            name: faker.company.companyName(),
            capacity: 0 ,
            hotelId
        }
    })
}