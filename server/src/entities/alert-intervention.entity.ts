import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';
import { HealthAlert } from './health-alert.entity';

@Entity('alert_interventions')
export class AlertIntervention {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  alertId: number;

  @Column()
  doctorId: number;

  @Column()
  patientId: number;

  @Column({ type: 'text' })
  aiSuggestion: string;

  @Column({ type: 'text', nullable: true })
  doctorModifiedSuggestion: string;

  @Column({ type: 'boolean', default: false })
  pushedToPatient: boolean;

  @Column({ type: 'boolean', default: false })
  pushedToFamily: boolean;

  @Column({ type: 'datetime', nullable: true })
  pushedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => HealthAlert)
  @JoinColumn({ name: 'alertId' })
  alert: HealthAlert;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;
}
