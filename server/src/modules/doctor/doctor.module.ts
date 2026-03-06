import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { Doctor, Patient, DoctorPatientRel, Activity, HealthAlert } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor, Patient, DoctorPatientRel, Activity, HealthAlert])],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule {}
