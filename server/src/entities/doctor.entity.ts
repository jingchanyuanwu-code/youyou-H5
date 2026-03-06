import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { DoctorPatientRel } from './doctor-patient-rel.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50, nullable: true })
  title: string;

  @Column({ length: 100, nullable: true })
  hospital: string;

  @Column({ length: 50, nullable: true })
  department: string;

  @Column({ length: 255, nullable: true })
  avatar: string;

  @Column({ length: 20, unique: true })
  phone: string;

  @Column({ length: 50, unique: true, nullable: true })
  bindCode: string;

  @Column({ default: true })
  isWhitelisted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => DoctorPatientRel, rel => rel.doctor)
  patientRelations: DoctorPatientRel[];
}
