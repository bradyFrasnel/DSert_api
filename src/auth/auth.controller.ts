// src/auth/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
  Get,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserPayloadDto } from './dto/user-payload.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
// methode post pour login
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() loginDto: LoginDto) {
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.motDePasse,
      );
      
      if (!user) {
        throw new UnauthorizedException('Identifiants invalides');
      }
      
      return this.authService.login(user);
    } catch (error) {
      throw new UnauthorizedException('Échec de la connexion');
    }
  }

  // Route d'inscription
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() registerDto: RegisterDto) {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("Erreur lors de l'inscription");
    }
  }

// methode get pour profile
  @Get('profile')
  // @UseGuards(JwtAuthGuard) sert à protéger la route
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req): UserPayloadDto {
    // Retourne les informations de l'utilisateur à partir du token JWT
    return {
      id: req.user.sub,
      email: req.user.email,
      motDePasse: req.user.motDePasse,
      role: req.user.role
    };
  }
}