import { UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from './zod-validation.pipe';
import * as zod from 'zod';

export const UseZodValidation = (schema: zod.ZodSchema) => {
  return UsePipes(new ZodValidationPipe(schema));
};