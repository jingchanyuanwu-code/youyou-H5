import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientAppController } from './patient-app.controller';
import { PatientAppService } from './patient-app.service';
import { Patient, PatientAccount, FamilyMember, RecoveryPlan, RecoveryTask, HealthAlert, ConsultationSession } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, PatientAccount, FamilyMember, RecoveryPlan, RecoveryTask, HealthAlert, ConsultationSession])],
  controllers: [PatientAppController],
  providers: [PatientAppService],
})
export class PatientAppModule {}
