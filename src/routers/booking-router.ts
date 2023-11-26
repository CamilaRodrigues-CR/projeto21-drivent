import { Router } from 'express';
import { authenticateToken, validateBody } from '@/middlewares';
import { getBooking, postBooking, putBooking } from '@/controllers';
import { bookingSchema } from '@/schemas/booking-schema';

const bookingRouter = Router();

bookingRouter
    .all('/*', authenticateToken)
    .get('/', getBooking)
    .post('/',validateBody(bookingSchema), postBooking)
    .put('/booking/:bookingId',validateBody(bookingSchema), putBooking)

export { bookingRouter };