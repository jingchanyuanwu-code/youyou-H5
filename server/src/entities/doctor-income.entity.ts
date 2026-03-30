import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';

export type IncomeCategory = 'monitoring' | 'consultation' | 'plan_review' | 'report_review' | 'referral_bonus';
export type SettlementStatus = 'settled' | 'pending' | 'processing';

@Entity('doctor_incomes')
export class DoctorIncome {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  doctorId: number;

  @Column({ nullable: true })
  patientId: number;

  @Column({ type: 'varchar', length: 30 })
  category: IncomeCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 200 })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  settlementStatus: SettlementStatus;

  @Column({ type: 'datetime', nullable: true })
  settledAt: Date;

  @CreateDateColumn()
  incomeDate: Date;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @ManyToOne(() => Patient, { nullable: true })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;
}
