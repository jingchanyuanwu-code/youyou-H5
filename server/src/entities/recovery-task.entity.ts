import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RecoveryPlan } from './recovery-plan.entity';

export type TaskType = 'medication' | 'monitoring' | 'exercise';
export type TaskStatus = 'pending' | 'completed' | 'missed';

@Entity('recovery_tasks')
export class RecoveryTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @Column({ nullable: true })
  planId: number;

  @ManyToOne(() => RecoveryPlan, { nullable: true })
  @JoinColumn({ name: 'planId' })
  plan: RecoveryPlan;

  @Column({ type: 'varchar', length: 20 })
  taskType: TaskType;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: TaskStatus;

  @Column({ type: 'varchar', length: 20 })
  taskDate: string;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  completedBy: number;

  @CreateDateColumn()
  createdAt: Date;
}
