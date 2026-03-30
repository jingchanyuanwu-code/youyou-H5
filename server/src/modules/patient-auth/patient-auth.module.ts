import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientAuthController } from './patient-auth.controller';
import { PatientAuthService } from './patient-auth.service';
import { Patient, PatientAccount, VerificationCode } from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, PatientAccount, VerificationCode]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'youyou-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [PatientAuthController],
  providers: [PatientAuthService],
  exports: [PatientAuthService],
})
export class PatientAuthModule {}
