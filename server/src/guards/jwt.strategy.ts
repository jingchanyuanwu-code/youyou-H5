import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'youyou-secret-key',
    });
  }

  async validate(payload: { sub: number; phone: string; role?: string; patientId?: number }) {
    return { id: payload.sub, phone: payload.phone, role: payload.role || 'doctor', patientId: payload.patientId };
  }
}
