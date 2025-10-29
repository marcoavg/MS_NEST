import { Body, Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';
import { register } from 'module';
import { NATS_SERVICE } from 'src/config/services';
import { LoginUserDto, RegisterUserDto } from './dto';
import { RpcException } from '@nestjs/microservices/exceptions/rpc-exception';
import { catchError } from 'rxjs/internal/operators/catchError';
import { AuthGuard } from './guards/auth.guard';
import { Token, User } from './decorators/user.decorator';
import { CurrentUser } from './interface/current-user.interface';

@Controller('auth')
export class AuthController {

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {

  }

  @Post('register')
  registerUser(@Body() registerDto: RegisterUserDto) {
    return this.client.send('auth.register.user', registerDto)
      .pipe(
        catchError(err => {
          throw new RpcException({
           err
          });
        })
      );
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.client.send('auth.login.user', loginUserDto).pipe(

      catchError(err => {
        throw new RpcException({
          err
        });
      })
    );
  }

  @UseGuards(AuthGuard)
  @Get('verify')
  verifyToken(@User() user: CurrentUser, @Token() token: string) {
    
    //return this.client.send('auth.verify.user', {});
    return { user, token };
  }

}
