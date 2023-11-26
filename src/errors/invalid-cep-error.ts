import { ApplicationError } from '@/protocols';

export function invalidCepError(): ApplicationError {
  return {
    name: 'InvalidCEPError',
    message: 'Invalid CEP search',
  };
}
