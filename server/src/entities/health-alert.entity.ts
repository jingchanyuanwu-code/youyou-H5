import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from './patient.entity';

export type AlertType = 'glucose' | 'bp' | 'hr';
export type AlertLevel = 'warning' | 'danger';
export type PatientStatus = 'urgent' | 'attention' | 'stable' | 'offline';

@Entity('health_alerts')
export class HealthAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ type: 'varchar', length: 20 })
  alertType: AlertType; // glucose: 血糖, bp: 血压, hr: 心率

  @Column({ type: 'varchar', length: 100 })
  value: string; // 异常数值，如 "158/98" 或 "7.8" 或 "120"

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string; // 单位，如 "mmHg", "mmol/L", "bpm"

  @Column({ type: 'varchar', length: 20 })
  level: AlertLevel; // 预警级别

  @Column({ type: 'text', nullable: true })
  description: string; // 预警描述

  @CreateDateColumn()
  alertTime: Date; // 预警时间
}
