
import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';

export const User = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if( !request.user ) {
        throw new InternalServerErrorException('User not found in request guards');
    }
    return request.user;
});

export const Token = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if( !request.token ) {
        throw new InternalServerErrorException('Token not found in request guards');
    }
    return request.token;
});
