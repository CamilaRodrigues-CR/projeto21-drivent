import app, { init } from '@/app';
import { cleanDb, generateValidToken } from '../helpers';
import supertest from 'supertest';
import { createEnrollmentWithAddress, createPayment, createTicket, createTicketType, createUser } from '../factories';
import { TicketStatus } from '@prisma/client';
import { createHotel, createRoomWithHotelId } from '../factories/hotels-factory';
import { createBooking } from '../factories/booking-factory';
import httpStatus from 'http-status';
import { any } from 'joi';

beforeAll(async () => {
    await init();
});

beforeEach(async () => {
    await cleanDb();
});

const server = supertest(app);

describe("GET booking", () => {
    it('should respond with status 200 and with the user booking', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketType(false, true);
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
        await createPayment(ticket.id, ticketType.price)
        const createdHotel = await createHotel()
        const room = await createRoomWithHotelId(createdHotel.id)
        const booking = await createBooking(user.id, room.id)

        const { status, body } = await server.get(`/booking`).set('Authorization', `Bearer ${token}`)
        expect(status).toBe(httpStatus.OK)
        expect(body).toEqual({
            id: booking.id,
            Room:
            {
                id: room.id,
                name: room.name,
                capacity: room.capacity,
                hotelId: room.hotelId,
                createdAt: room.createdAt.toISOString(),
                updatedAt: room.updatedAt.toISOString(),
            }
        }
        )
    })
});


describe("POST booking", () => {
    it('should return status 200 and the bookingId', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketType(false, true);
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
        await createPayment(ticket.id, ticketType.price)
        const createdHotel = await createHotel()
        const room = await createRoomWithHotelId(createdHotel.id)

        const response = await server
            .post('/booking')
            .set('Authorization', `Bearer ${token}`)
            .send({ roomId: room.id });

        expect(response.status).toBe(httpStatus.OK)
        expect(response.body).toEqual({
            bookingId: expect.any(Number)
        })
    })
});


describe("PUT booking", () => {
    it('should return status 200 and the bookingId', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketType(false, true);
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
        await createPayment(ticket.id, ticketType.price)
        const createdHotel = await createHotel()
        const room = await createRoomWithHotelId(createdHotel.id)
        const booking = await createBooking(user.id, room.id)

        const response = await server
            .put(`/booking/booking/${booking.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ roomId: room.id });

        expect(response.status).toBe(httpStatus.OK)
        expect(response.body).toEqual({
            bookingId: booking.id
        })
    })
});
