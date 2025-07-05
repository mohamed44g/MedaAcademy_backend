import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CustomRequest, IPayload } from 'src/utils/types';

export const userPayload = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request: CustomRequest = context.switchToHttp().getRequest();
    const payload = request.user;
    return payload;
  },
);
