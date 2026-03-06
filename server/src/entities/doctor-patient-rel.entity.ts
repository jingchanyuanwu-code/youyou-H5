import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';

@Entity('doctor_patient_rel')
@Unique(['doctorId', 'patientId'])
export class DoctorPatientRel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  doctorId: number;

  @Column()
  patientId: number;

  @CreateDateColumn()
  bindTime: Date;

  @ManyToOne(() => Doctor, doctor => doctor.patientRelations)
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @ManyToOne(() => Patient, patient => patient.doctorRelations)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;
}
