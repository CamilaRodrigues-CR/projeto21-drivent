import { ApplicationError } from '@/protocols';

export function forbiddenBookingError(): ApplicationError {
  return {
    name: 'forbiddenError',
    message: 'The booking was not allowed!',
  };
}