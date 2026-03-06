import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { DoctorPatientRel } from './doctor-patient-rel.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 10, default: 'unknown' })
  gender: 'male' | 'female' | 'unknown';

  @Column({ nullable: true })
  age: number;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'datetime', nullable: true })
  lastMeasureTime: Date; // 最后测量时间

  @Column({ type: 'int', default: 0 })
  stableDays: number; // 持续达标天数

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => DoctorPatientRel, rel => rel.patient)
  doctorRelations: DoctorPatientRel[];
}
