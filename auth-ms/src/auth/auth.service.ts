import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoginUserDto, RegisterUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { RpcException, Payload } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { JwtPayload } from './interfaces/jwt-payload.inteface';
import { envs } from 'src/config';


@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
    
    
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly jwtService: JwtService,
    ) {
        super();
    }
    
    onModuleInit() {
        this.$connect();
        this.logger.log('Connected to the database');
    }

    async signJWT(payload: JwtPayload){
        return this.jwtService.signAsync(payload);
    }
    
    async registerUser(registerUserDto: RegisterUserDto) {
        try {
            const user = await this.user.findUnique({
                where: { email: registerUserDto.email },
            });
            if (user) {
                throw new RpcException({
                    status: 400,
                    message: 'User already exists',
                });
            }
            
            const newUser = await this.user.create({
                data: {
                    email: registerUserDto.email,
                    password: bcrypt.hashSync(registerUserDto.password, 10),
                    name: registerUserDto.name,
                },
            });
            const { password:__, ...userWithoutPassword } = newUser;
            return {
                user: userWithoutPassword, 
                token: await this.signJWT(userWithoutPassword)
            };

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: 'User registration failed--',
                error: error.message,
            });
        }
    }

    async loginUser(loginUserDto: LoginUserDto) {
        try {
            const user = await this.user.findUnique({
                where: { email: loginUserDto.email },
            });
            if (!user) {
                throw new RpcException({
                    status: 400,
                    message: 'User not found',
                });
            }
            
            const isPasswordValid = bcrypt.compareSync(loginUserDto.password, user.password);
            if (!isPasswordValid) {
                throw new RpcException({
                    status: 400,
                    message: 'Invalid password',
                });
            }
            const { password:__, ...userWithoutPassword } = user;
             return {
                user: userWithoutPassword, 
                token: await this.signJWT(userWithoutPassword)
            };

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: 'User login failed',
                error: error.message,
            });
        }
    }

    async verifyToken(token: string) {
      try {
          const { sub, iat, exp, ...user} = await this.jwtService.verify(token,{
                secret: envs.jwtKey,
          });
          return {
            user,
            token: await this.signJWT(user),
          };
      } catch (error) {
        throw new RpcException({
            status: 401,
            message: 'Invalid token',
            error: error.message,
        });
      }
    }


}
