import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type ConsultationType = 'ai' | 'doctor';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

@Entity('consultation_sessions')
export class ConsultationSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  accountId: number;

  @Column()
  patientId: number;

  @Column({ type: 'varchar', length: 10 })
  consultationType: ConsultationType;

  @Column({ type: 'simple-json', nullable: true })
  messages: ChatMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
