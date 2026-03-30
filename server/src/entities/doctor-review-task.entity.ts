import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';
import { HealthAlert } from './health-alert.entity';

@Entity('doctor_review_tasks')
export class DoctorReviewTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  doctorId: number;

  @Column()
  patientId: number;

  @Column({ length: 50 })
  taskType: string; // high_risk_alert | plan_adjustment | initial_plan | monthly_report

  @Column({ length: 20, default: 'pending' })
  status: string; // pending | approved | rejected

  @Column({ type: 'int', default: 4 })
  priority: number; // 1=highest, 4=lowest

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  context: string; // JSON string

  @Column({ type: 'datetime', nullable: true })
  deadline: Date;

  @Column({ type: 'text', nullable: true })
  reviewComment: string;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  alertId: number;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => HealthAlert, { nullable: true })
  @JoinColumn({ name: 'alertId' })
  alert: HealthAlert;
}
