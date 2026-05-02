import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface SessionUser {
  id: string;
  email: string;
  username: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
