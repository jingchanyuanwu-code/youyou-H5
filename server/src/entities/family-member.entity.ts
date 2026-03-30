import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { PatientAccount } from './patient-account.entity';
import { Patient } from './patient.entity';

@Entity('family_members')
@Unique(['accountId', 'patientId'])
export class FamilyMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  accountId: number;

  @ManyToOne(() => PatientAccount)
  @JoinColumn({ name: 'accountId' })
  account: PatientAccount;

  @Column()
  patientId: number;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ length: 20 })
  relationship: string;

  @CreateDateColumn()
  createdAt: Date;
}
