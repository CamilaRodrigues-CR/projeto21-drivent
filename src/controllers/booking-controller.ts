import { AuthenticatedRequest } from "@/middlewares";
import { InputBookingBody } from "@/protocols";
import { bookingService } from "@/services/booking-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;

    const booking = await bookingService.getBooking(userId)
    const result = {
        id: booking.id,
        Room: booking.Room
    }

    res.status(httpStatus.OK).send(result);
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    const { roomId } = req.body as InputBookingBody;

    const booking = await bookingService.postBooking(userId, roomId)

    res.status(httpStatus.OK).send({bookingId: booking.id})
}

export async function putBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    const bookingId = Number(req.params.bookingId);
    const { roomId } = req.body as InputBookingBody;


    const booking = await bookingService.putBooking(userId, bookingId, roomId)

    res.status(httpStatus.OK).send({bookingId: booking.id})
}