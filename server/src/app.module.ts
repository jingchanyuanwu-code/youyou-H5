import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { Doctor, Patient, DoctorPatientRel, Activity, VerificationCode, HealthAlert } from './entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [Doctor, Patient, DoctorPatientRel, Activity, VerificationCode, HealthAlert],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Doctor, Patient, DoctorPatientRel, Activity, HealthAlert]),
    AuthModule,
    DoctorModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    @InjectRepository(DoctorPatientRel) private relRepo: Repository<DoctorPatientRel>,
    @InjectRepository(Activity) private activityRepo: Repository<Activity>,
    @InjectRepository(HealthAlert) private alertRepo: Repository<HealthAlert>,
  ) {}

  async onModuleInit() {
    const now = new Date();
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
    const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    // 插入医生
    const doctor1 = await this.doctorRepo.save({
      name: '张医生', title: '主任医师', hospital: '北京协和医院',
      department: '心内科', phone: '13800138000', bindCode: 'BIND001', isWhitelisted: true,
    });

    // 插入10条多状态患者数据
    const patients = await this.patientRepo.save([
      // 紧急状态 - 今日有严重预警
      { name: '王建国', gender: 'male', age: 58, phone: '13700137001', lastMeasureTime: hoursAgo(1), stableDays: 0 },
      { name: '李淑芬', gender: 'female', age: 62, phone: '13700137002', lastMeasureTime: hoursAgo(2), stableDays: 0 },
      // 关注状态 - 近期有波动
      { name: '张明辉', gender: 'male', age: 45, phone: '13700137003', lastMeasureTime: hoursAgo(6), stableDays: 0 },
      { name: '陈晓燕', gender: 'female', age: 38, phone: '13700137004', lastMeasureTime: hoursAgo(12), stableDays: 0 },
      { name: '刘德华', gender: 'male', age: 51, phone: '13700137005', lastMeasureTime: hoursAgo(8), stableDays: 0 },
      // 平稳状态 - 持续达标
      { name: '赵丽颖', gender: 'female', age: 33, phone: '13700137006', lastMeasureTime: hoursAgo(4), stableDays: 15 },
      { name: '周杰伦', gender: 'male', age: 42, phone: '13700137007', lastMeasureTime: hoursAgo(10), stableDays: 7 },
      { name: '黄晓明', gender: 'male', age: 47, phone: '13700137008', lastMeasureTime: hoursAgo(18), stableDays: 21 },
      // 失联状态 - 超过48小时未测量
      { name: '杨幂', gender: 'female', age: 36, phone: '13700137009', lastMeasureTime: daysAgo(3), stableDays: 0 },
      { name: '吴京', gender: 'male', age: 49, phone: '13700137010', lastMeasureTime: daysAgo(5), stableDays: 0 },
    ]);

    // 绑定患者到医生
    for (const p of patients) {
      await this.relRepo.save({ doctorId: doctor1.id, patientId: p.id });
    }

    // 生成预警数据
    const alerts: Partial<HealthAlert>[] = [];

    // 患者1 王建国 - 紧急：今日血压严重超标
    alerts.push(
      { patientId: patients[0].id, alertType: 'bp', value: '182/115', unit: 'mmHg', level: 'danger', description: '血压严重超标，请立即联系患者', alertTime: hoursAgo(1) },
      { patientId: patients[0].id, alertType: 'bp', value: '168/102', unit: 'mmHg', level: 'danger', description: '血压持续偏高', alertTime: daysAgo(1) },
      { patientId: patients[0].id, alertType: 'bp', value: '155/95', unit: 'mmHg', level: 'warning', description: '血压偏高', alertTime: daysAgo(3) },
    );

    // 患者2 李淑芬 - 紧急：今日血糖严重超标
    alerts.push(
      { patientId: patients[1].id, alertType: 'glucose', value: '14.2', unit: 'mmol/L', level: 'danger', description: '餐后血糖严重超标', alertTime: hoursAgo(2) },
      { patientId: patients[1].id, alertType: 'glucose', value: '12.8', unit: 'mmol/L', level: 'danger', description: '血糖控制不佳', alertTime: hoursAgo(6) },
      { patientId: patients[1].id, alertType: 'bp', value: '152/94', unit: 'mmHg', level: 'warning', description: '血压偏高', alertTime: daysAgo(2) },
    );

    // 患者3 张明辉 - 关注：近期有波动
    alerts.push(
      { patientId: patients[2].id, alertType: 'hr', value: '108', unit: 'bpm', level: 'warning', description: '心率偏快', alertTime: daysAgo(1) },
      { patientId: patients[2].id, alertType: 'hr', value: '115', unit: 'bpm', level: 'danger', description: '心率异常', alertTime: daysAgo(3) },
      { patientId: patients[2].id, alertType: 'bp', value: '145/92', unit: 'mmHg', level: 'warning', description: '血压偏高', alertTime: daysAgo(5) },
    );

    // 患者4 陈晓燕 - 关注：血糖波动
    alerts.push(
      { patientId: patients[3].id, alertType: 'glucose', value: '9.5', unit: 'mmol/L', level: 'warning', description: '餐后血糖偏高', alertTime: daysAgo(1) },
      { patientId: patients[3].id, alertType: 'glucose', value: '8.8', unit: 'mmol/L', level: 'warning', description: '空腹血糖偏高', alertTime: daysAgo(4) },
    );

    // 患者5 刘德华 - 关注：血压波动
    alerts.push(
      { patientId: patients[4].id, alertType: 'bp', value: '148/95', unit: 'mmHg', level: 'warning', description: '血压偏高', alertTime: daysAgo(2) },
      { patientId: patients[4].id, alertType: 'bp', value: '142/90', unit: 'mmHg', level: 'warning', description: '血压临界', alertTime: daysAgo(6) },
    );

    // 患者6-8 平稳状态，无预警

    // 患者9-10 失联状态，有历史预警但最近未测量
    alerts.push(
      { patientId: patients[8].id, alertType: 'glucose', value: '8.2', unit: 'mmol/L', level: 'warning', description: '血糖偏高', alertTime: daysAgo(4) },
      { patientId: patients[9].id, alertType: 'bp', value: '150/95', unit: 'mmHg', level: 'warning', description: '血压偏高', alertTime: daysAgo(6) },
    );

    await this.alertRepo.save(alerts);

    // 插入活动
    await this.activityRepo.save([
      { name: '2024健康管理计划', linkTemplate: 'https://youyou.com/activity/health2024?doctor={doctorId}&code={bindCode}', isActive: true },
      { name: '慢病随访活动', linkTemplate: 'https://youyou.com/activity/chronic?doctor={doctorId}', isActive: true },
    ]);

    console.log('测试数据已初始化：10位患者，多状态覆盖');
  }
}
