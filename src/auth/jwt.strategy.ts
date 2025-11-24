/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// Interface pour le contenu décodé du JWT
export interface JwtPayload {
  email: string;
  sub: string; // ID de l'employé
  role: 'admin' | 'manager' | 'employe';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error(
        "JWT_SECRET n'est pas défini dans les variables d'environnement",
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
      ignoreExpiration: false,
    });
  }

  // Cette méthode est appelée après la validation du token
  async validate(payload: JwtPayload) {
    // Le contenu du payload (email, sub, role) sera injecté dans req.user
    return {
      id: payload.sub, // Utilisez 'id' au lieu de 'employeId' pour la cohérence
      email: payload.email,
      role: payload.role,
    };
  }
}
