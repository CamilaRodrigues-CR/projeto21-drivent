import app, { init } from "@/app";
import { cleanDb, generateValidToken } from "../helpers";
import supertest from "supertest";
import { prisma } from '@/config';
import httpStatus from 'http-status';
import faker from '@faker-js/faker';
import { createEnrollmentWithAddress, createPayment, createTicket, createTicketType, createUser } from "../factories";
import * as jwt from 'jsonwebtoken';
import { TicketStatus } from "@prisma/client";
import { createHotel, createRoomWithHotelId } from "../factories/hotels-factory";

beforeAll(async () => {
    await init();
});

beforeEach(async () => {
    await cleanDb();
});

const server = supertest(app);

describe('GET /hotels', () => {
    it('should respond with status 401 if no token is given', async () => {
        const response = await server.get('/hotels');

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();

        const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe('when token is valid', () => {
        it('should respond with status 404 when user has no enrollment', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);

            const { status } = await server.get("/hotels").set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.NOT_FOUND)
        })

        it('should respond with status 404 when user has enrollment but no ticket', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            await createEnrollmentWithAddress(user)

            const { status } = await server.get("/hotels").set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.NOT_FOUND)
        })

        it('should respond with status 404 when there are no hotels', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, true);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const { status } = await server.get("/hotels").set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.NOT_FOUND)
        })

        it('should respond with status 402 when user ticket is remote', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(true, false);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const { status } = await server.get("/hotels").set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.PAYMENT_REQUIRED)
        })

        it('should respond with status 402 when ticket is not paid', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, true);
            await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED)

            const { status } = await server.get("/hotels").set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.PAYMENT_REQUIRED)
        })

        it('should respond with status 402 when ticket doenst include hotel', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, false);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const { status } = await server.get("/hotels").set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.PAYMENT_REQUIRED)
        })

        it('should respond with status 200 and a list of hotels', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, true);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)
            const createdHotel = await createHotel()

            const { status, body } = await server.get("/hotels").set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.OK)
            expect(body).toEqual([
                {
                    id: createdHotel.id,
                    name: createdHotel.name,
                    image: createdHotel.image,
                    createdAt: createdHotel.createdAt.toISOString(),
                    updatedAt: createdHotel.updatedAt.toISOString(),
                }
            ])
        })
    })
})

describe('GET /hotels/:holelId', () => {
    it('should respond with status 401 if no token is given', async () => {
        const response = await server.get('/hotels/1');

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();

        const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe('when token is valid', () => {
        it('should respond with status 404 when user has no enrollment', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const createdHotel = await createHotel()
            const room = await createRoomWithHotelId(createdHotel.id)

            const { status } = await server.get(`/hotels/${createdHotel.id}`).set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.NOT_FOUND)
        })

        it('should respond with status 404 when user has enrollment but no ticket', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            await createEnrollmentWithAddress(user)
            const createdHotel = await createHotel()
            const room = await createRoomWithHotelId(createdHotel.id)

            const { status } = await server.get(`/hotels/${createdHotel.id}`).set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.NOT_FOUND)
        })

        it('should respond with status 404 when hotel id does not exist', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, true);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)
            const createdHotel = await createHotel()

            await prisma.hotel.delete({
                where: {
                    id: createdHotel.id
                }
            })

            const { status } = await server.get(`/hotels/${createdHotel.id}`).set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.NOT_FOUND)
        })

        it('should respond with status 402 when user ticket is remote', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(true, false);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)
            const createdHotel = await createHotel()
            const room = await createRoomWithHotelId(createdHotel.id)

            const { status } = await server.get(`/hotels/${createdHotel.id}`).set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.PAYMENT_REQUIRED)
        })

        it('should respond with status 402 when ticket is not paid', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, true);
            await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED)
            const createdHotel = await createHotel()
            const room = await createRoomWithHotelId(createdHotel.id)

            const { status } = await server.get(`/hotels/${createdHotel.id}`).set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.PAYMENT_REQUIRED)
        })

        it('should respond with status 402 when ticket doenst include hotel', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, false);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)
            const createdHotel = await createHotel()
            const room = await createRoomWithHotelId(createdHotel.id)

            const { status } = await server.get(`/hotels/${createdHotel.id}`).set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.PAYMENT_REQUIRED)
        })

        it('should respond with status 200 and hotel with rooms', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, true);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)
            const createdHotel = await createHotel()
            const room = await createRoomWithHotelId(createdHotel.id)

            const { status, body } = await server.get(`/hotels/${createdHotel.id}`).set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.OK)
            expect(body).toEqual({
                id: createdHotel.id,
                name: createdHotel.name,
                image: createdHotel.image,
                createdAt: createdHotel.createdAt.toISOString(),
                updatedAt: createdHotel.updatedAt.toISOString(),
                Rooms: [
                    {
                        id: room.id,
                        name: room.name,
                        capacity: room.capacity,
                        hotelId: room.hotelId,
                        createdAt: room.createdAt.toISOString(),
                        updatedAt: room.updatedAt.toISOString(),
                    }
                ]
            }
            )
        })

        it('should respond with status 200 and hotel with no rooms', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType(false, true);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)
            const createdHotel = await createHotel()

            const { status, body } = await server.get(`/hotels/${createdHotel.id}`).set('Authorization', `Bearer ${token}`)
            expect(status).toBe(httpStatus.OK)
            expect(body).toEqual({
                id: createdHotel.id,
                name: createdHotel.name,
                image: createdHotel.image,
                createdAt: createdHotel.createdAt.toISOString(),
                updatedAt: createdHotel.updatedAt.toISOString(),
                Rooms: []
            }
            )
        })
    })
})