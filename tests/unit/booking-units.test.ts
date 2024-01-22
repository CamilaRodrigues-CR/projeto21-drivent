import app, { init } from '@/app';
import { cleanDb, generateValidToken } from '../helpers';
import supertest from 'supertest';
import httpStatus from 'http-status';
import faker from '@faker-js/faker';
import { createEnrollmentWithAddress, createPayment, createTicket, createTicketType, createUser } from '../factories';
import * as jwt from 'jsonwebtoken';
import { TicketStatus } from '@prisma/client';
import { createHotel, createRoomWithHotelId } from '../factories/hotels-factory';
import { createBooking, createForbiddenRoom } from '../factories/booking-factory';

beforeAll(async () => {
    await init();
});

beforeEach(() => {
    jest.clearAllMocks();
})

beforeEach(async () => {
    await cleanDb();
});

const server = supertest(app);

describe("GET booking", () => {
    it('should respond with status 401 if no token is given', async () => {
        const response = await server.get('/booking');

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();

        const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("when token is valid", () => {
        it('should respond with status 404 when user has no enrollment', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const { status } = await server.get("/booking").set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.NOT_FOUND)
        })

        it('should respond with status 404 when user has enrollment but no ticket', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            await createEnrollmentWithAddress(user)

            const { status } = await server.get("/booking").set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.NOT_FOUND)
        })

        it('should respond with status 404 when there are no hotels', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, true);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const { status } = await server.get("/booking").set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.NOT_FOUND)
        })

        it('should respond with status 404 when user ticket is remote', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(true, false);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const { status } = await server.get("/booking").set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.NOT_FOUND)
        })

        it('should respond with status 404 when ticket is not paid', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, true);
            await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED)

            const { status } = await server.get("/booking").set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.NOT_FOUND)
        })

        it('should respond with status 404 when user has no booking', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, true);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)
            const createdHotel = await createHotel()
            await createRoomWithHotelId(createdHotel.id)

            const { status } = await server.get("/booking").set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.NOT_FOUND)
        })
    })
});


describe("POST booking", () => {
    it('should respond with status 401 if no token is given', async () => {
        const response = await server.post('/booking');

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();

        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("when token is valid", () => {
        it('should respond with status 404 when user has no enrollment', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);

            const response = await server
                .post('/booking')
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: 1 });

            expect(response.status).toBe(httpStatus.NOT_FOUND)
        })

        it('should respond with status 404 when user has enrollment but no ticket', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            await createEnrollmentWithAddress(user)

            const response = await server
                .post('/booking')
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: 1 });

            expect(response.status).toBe(httpStatus.NOT_FOUND)
        })

        it('should respond with status 403 when user ticket is remote', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(true, false);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const response = await server
                .post('/booking')
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: 1 });

            expect(response.status).toBe(httpStatus.FORBIDDEN)
        })

        it('should respond with status 403 when ticket is not paid', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, true);
            await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED)

            const response = await server
                .post('/booking')
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: 1 });

            expect(response.status).toBe(httpStatus.FORBIDDEN)
        })

        it('should respond with status 404 when user has no booking', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, true);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)
            const createdHotel = await createHotel()
            await createRoomWithHotelId(createdHotel.id)

            const response = await server
                .post('/booking')
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: 1 });

            expect(response.status).toBe(httpStatus.NOT_FOUND)
        })
        it('should response with 403 if the room hasnt capacity', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, true);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)
            const createdHotel = await createHotel()
            const room = await createForbiddenRoom(createdHotel.id)
            
            const response = await server
                .post(`/booking`)
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: room.id });

            expect(response.status).toBe(httpStatus.FORBIDDEN)
        })
    })

});


describe("PUT booking", () => {
    it('should respond with status 401 if no token is given', async () => {
        const response = await server.put('/booking/booking/1');

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();

        const response = await server.put('/booking/booking/1').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.put('/booking/booking/1').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("when token is valid", () => {
        it('should respond with status 404 when user has no enrollment', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);

            const response = await server
                .put("/booking/booking/1")
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: 1 });

            expect(response.status).toBe(httpStatus.NOT_FOUND)
        })

        it('should respond with status 404 when user has enrollment but no ticket', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            await createEnrollmentWithAddress(user)

            const response = await server
                .put("/booking/booking/1")
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: 1 });

            expect(response.status).toBe(httpStatus.NOT_FOUND)

        })


        it('should respond with status 403 when user ticket is remote', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(true, false);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const response = await server
                .put("/booking/booking/1")
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: 1 });

            expect(response.status).toBe(httpStatus.FORBIDDEN)

        })

        it('should respond with status 403 when ticket is not paid', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, true);
            await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED)

            const response = await server
                .put("/booking/booking/1")
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: 1 });

            expect(response.status).toBe(httpStatus.FORBIDDEN)
        })

        it('should respond with status 403 when user has no booking', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, true);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)
            const createdHotel = await createHotel()
            await createRoomWithHotelId(createdHotel.id)

            const response = await server
                .put("/booking/booking/1")
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: 1 });

            expect(response.status).toBe(httpStatus.FORBIDDEN)

        })

        it('should response with 403 if the new room hasnt capacity', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, true);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)
            const createdHotel = await createHotel()
            const room = await createForbiddenRoom(createdHotel.id)
            const booking = await createBooking(user.id, room.id)

            const response = await server
                .put(`/booking/booking/${booking.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: room.id });

            expect(response.status).toBe(httpStatus.FORBIDDEN)
        })
    })
});

