import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { PatientAuthModule } from './modules/patient-auth/patient-auth.module';
import { PatientAppModule } from './modules/patient-app/patient-app.module';
import {
  Doctor, Patient, DoctorPatientRel, Activity, VerificationCode, HealthAlert,
  PatientAccount, FamilyMember, RecoveryPlan, RecoveryTask, ConsultationSession,
  DoctorReviewTask, DoctorMessage, AlertIntervention, DoctorIncome,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [
        Doctor, Patient, DoctorPatientRel, Activity, VerificationCode, HealthAlert,
        PatientAccount, FamilyMember, RecoveryPlan, RecoveryTask, ConsultationSession,
        DoctorReviewTask, DoctorMessage, AlertIntervention, DoctorIncome,
      ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      Doctor, Patient, DoctorPatientRel, Activity, HealthAlert,
      PatientAccount, FamilyMember, RecoveryPlan, RecoveryTask, ConsultationSession,
      DoctorReviewTask, DoctorMessage, DoctorIncome,
    ]),
    AuthModule,
    DoctorModule,
    PatientAuthModule,
    PatientAppModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    @InjectRepository(DoctorPatientRel) private relRepo: Repository<DoctorPatientRel>,
    @InjectRepository(Activity) private activityRepo: Repository<Activity>,
    @InjectRepository(HealthAlert) private alertRepo: Repository<HealthAlert>,
    @InjectRepository(PatientAccount) private accountRepo: Repository<PatientAccount>,
    @InjectRepository(FamilyMember) private familyRepo: Repository<FamilyMember>,
    @InjectRepository(RecoveryPlan) private planRepo: Repository<RecoveryPlan>,
    @InjectRepository(RecoveryTask) private taskRepo: Repository<RecoveryTask>,
    @InjectRepository(DoctorReviewTask) private reviewTaskRepo: Repository<DoctorReviewTask>,
    @InjectRepository(DoctorMessage) private messageRepo: Repository<DoctorMessage>,
    @InjectRepository(DoctorIncome) private incomeRepo: Repository<DoctorIncome>,
  ) {}

  async onModuleInit() {
    const now = new Date();
    const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
    const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    // 插入医生
    const doctor1 = await this.doctorRepo.save({
      name: '张医生', title: '主任医师', hospital: '兰州大学第一医院',
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
      // 新增：血压/血糖预警患者
      { name: '孙文静', gender: 'female', age: 55, phone: '13700137011', lastMeasureTime: hoursAgo(1), stableDays: 0 },
      { name: '马志强', gender: 'male', age: 60, phone: '13700137012', lastMeasureTime: hoursAgo(3), stableDays: 0 },
      { name: '林小梅', gender: 'female', age: 48, phone: '13700137013', lastMeasureTime: hoursAgo(2), stableDays: 0 },
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

    // 患者2 李淑芬 - 紧急：刚刚血压危急（妻子紧急场景核心预警）
    alerts.push(
      { patientId: patients[1].id, alertType: 'bp', value: '185/120', unit: 'mmHg', level: 'danger', description: '血压危急！收缩压超过180mmHg，患者诉头痛头晕、视物模糊，疑似高血压危象，请立即处置！', alertTime: minutesAgo(2) },
      { patientId: patients[1].id, alertType: 'hr', value: '105', unit: 'bpm', level: 'danger', description: '心率加快，伴血压危急升高', alertTime: minutesAgo(2) },
      { patientId: patients[1].id, alertType: 'glucose', value: '14.2', unit: 'mmol/L', level: 'danger', description: '餐后血糖严重超标', alertTime: hoursAgo(2) },
      { patientId: patients[1].id, alertType: 'bp', value: '162/105', unit: 'mmHg', level: 'danger', description: '血压持续升高', alertTime: hoursAgo(4) },
      { patientId: patients[1].id, alertType: 'bp', value: '152/94', unit: 'mmHg', level: 'warning', description: '血压偏高', alertTime: daysAgo(2) },
    );

    // 患者3 张明辉 - 关注：近期有波动
    alerts.push(
      { patientId: patients[2].id, alertType: 'hr', value: '108', unit: 'bpm', level: 'warning', description: '心率偏快', alertTime: daysAgo(1) },
      { patientId: patients[2].id, alertType: 'hr', value: '115', unit: 'bpm', level: 'danger', description: '心率异常', alertTime: daysAgo(3) },
      { patientId: patients[2].id, alertType: 'bp', value: '145/92', unit: 'mmHg', level: 'warning', description: '血压偏高', alertTime: daysAgo(5) },
    );

    // 患者4 陈晓燕 - 紧急：心率突然飙升（刚刚发生，家属场景核心预警）
    alerts.push(
      { patientId: patients[3].id, alertType: 'hr', value: '128', unit: 'bpm', level: 'danger', description: '心率突然飙升至128bpm，伴有心悸胸闷，请立即关注！', alertTime: minutesAgo(5) },
      { patientId: patients[3].id, alertType: 'hr', value: '112', unit: 'bpm', level: 'danger', description: '心率持续偏快，需注意观察', alertTime: hoursAgo(3) },
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

    // 患者11 孙文静 - 紧急：血糖严重超标（糖尿病患者）
    alerts.push(
      { patientId: patients[10].id, alertType: 'glucose', value: '16.8', unit: 'mmol/L', level: 'danger', description: '餐后血糖严重超标，已超过16mmol/L，建议立即调整降糖方案', alertTime: hoursAgo(1) },
      { patientId: patients[10].id, alertType: 'glucose', value: '12.5', unit: 'mmol/L', level: 'danger', description: '空腹血糖明显升高', alertTime: daysAgo(1) },
      { patientId: patients[10].id, alertType: 'glucose', value: '10.3', unit: 'mmol/L', level: 'warning', description: '餐后血糖偏高', alertTime: daysAgo(2) },
      { patientId: patients[10].id, alertType: 'bp', value: '155/98', unit: 'mmHg', level: 'warning', description: '血压偏高，注意合并血糖异常', alertTime: daysAgo(1) },
    );

    // 患者12 马志强 - 紧急：血压持续升高
    alerts.push(
      { patientId: patients[11].id, alertType: 'bp', value: '178/112', unit: 'mmHg', level: 'danger', description: '血压持续偏高，收缩压接近180mmHg，需紧急处理', alertTime: hoursAgo(3) },
      { patientId: patients[11].id, alertType: 'bp', value: '165/105', unit: 'mmHg', level: 'danger', description: '血压显著升高', alertTime: daysAgo(1) },
      { patientId: patients[11].id, alertType: 'bp', value: '158/100', unit: 'mmHg', level: 'warning', description: '血压偏高', alertTime: daysAgo(3) },
      { patientId: patients[11].id, alertType: 'glucose', value: '8.9', unit: 'mmol/L', level: 'warning', description: '空腹血糖偏高', alertTime: daysAgo(2) },
    );

    // 患者13 林小梅 - 关注：血糖+血压双项波动
    alerts.push(
      { patientId: patients[12].id, alertType: 'glucose', value: '13.6', unit: 'mmol/L', level: 'danger', description: '餐后血糖严重超标', alertTime: hoursAgo(2) },
      { patientId: patients[12].id, alertType: 'bp', value: '162/100', unit: 'mmHg', level: 'danger', description: '血压明显升高', alertTime: hoursAgo(5) },
      { patientId: patients[12].id, alertType: 'glucose', value: '9.8', unit: 'mmol/L', level: 'warning', description: '空腹血糖偏高', alertTime: daysAgo(1) },
      { patientId: patients[12].id, alertType: 'bp', value: '148/92', unit: 'mmHg', level: 'warning', description: '血压偏高', alertTime: daysAgo(3) },
    );

    await this.alertRepo.save(alerts);

    // 获取保存后的预警 ID 用于关联审核任务
    const wjgBpAlert = await this.alertRepo.findOne({ where: { patientId: patients[0].id, alertType: 'bp' as any, value: '182/115' } });
    const cxyHrAlert = await this.alertRepo.findOne({ where: { patientId: patients[3].id, alertType: 'hr' as any, value: '128' } });
    const lsfBpAlert = await this.alertRepo.findOne({ where: { patientId: patients[1].id, alertType: 'bp' as any, value: '185/120' } });
    const swjGlucoseAlert = await this.alertRepo.findOne({ where: { patientId: patients[10].id, alertType: 'glucose' as any, value: '16.8' } });
    const mzqBpAlert = await this.alertRepo.findOne({ where: { patientId: patients[11].id, alertType: 'bp' as any, value: '178/112' } });
    const lxmGlucoseAlert = await this.alertRepo.findOne({ where: { patientId: patients[12].id, alertType: 'glucose' as any, value: '13.6' } });

    // 插入活动
    await this.activityRepo.save([
      { name: '2024健康管理计划', linkTemplate: 'https://youyou.com/activity/health2024?doctor={doctorId}&code={bindCode}', isActive: true },
      { name: '慢病随访活动', linkTemplate: 'https://youyou.com/activity/chronic?doctor={doctorId}', isActive: true },
    ]);

    console.log('测试数据已初始化：13位患者，多状态覆盖');

    // ========== 患者端种子数据 ==========

    // 创建患者账号（王建国）
    const account1 = await this.accountRepo.save({
      patientId: patients[0].id,
      phone: '13700137001',
      nickname: '王建国',
      currentIdentity: 'patient',
    });

    // 绑定家庭成员（李淑芬 - 妻子，张明辉 - 父亲，陈晓燕 - 女儿）
    await this.familyRepo.save([
      { accountId: account1.id, patientId: patients[1].id, relationship: '妻子' },
      { accountId: account1.id, patientId: patients[2].id, relationship: '父亲' },
      { accountId: account1.id, patientId: patients[3].id, relationship: '女儿' },
    ]);

    // 创建康复计划
    await this.planRepo.save([
      { patientId: patients[0].id, stage: 'II', surgeryDate: '2026-01-15', description: '居家初期康复，注意血压监测', isActive: true },
      { patientId: patients[1].id, stage: 'I', surgeryDate: '2026-02-20', description: '床旁康复期，卧床休息为主', isActive: true },
      { patientId: patients[2].id, stage: 'III', surgeryDate: '2025-12-01', description: '规律康复期，可增加运动量', isActive: true },
      { patientId: patients[3].id, stage: 'II', surgeryDate: '2026-02-01', description: '居家初期康复，注意心率监测', isActive: true },
    ]);

    // 创建今日康复任务
    const today = new Date().toISOString().split('T')[0];
    // 王建国的任务
    await this.taskRepo.save([
      { patientId: patients[0].id, planId: 1, taskType: 'medication', title: '服用阿司匹林 100mg', status: 'completed', taskDate: today, completedAt: new Date(now.getTime() - 3 * 3600000) },
      { patientId: patients[0].id, planId: 1, taskType: 'monitoring', title: '测量血压并记录', status: 'pending', taskDate: today },
      { patientId: patients[0].id, planId: 1, taskType: 'exercise', title: '散步15分钟', status: 'pending', taskDate: today },
    ]);
    // 李淑芬的任务
    await this.taskRepo.save([
      { patientId: patients[1].id, planId: 2, taskType: 'medication', title: '服用降糖药', status: 'pending', taskDate: today },
      { patientId: patients[1].id, planId: 2, taskType: 'monitoring', title: '测量血糖', status: 'pending', taskDate: today },
      { patientId: patients[1].id, planId: 2, taskType: 'exercise', title: '床上关节活动', status: 'completed', taskDate: today, completedAt: new Date(now.getTime() - 2 * 3600000) },
    ]);
    // 张明辉的任务
    await this.taskRepo.save([
      { patientId: patients[2].id, planId: 3, taskType: 'medication', title: '服用倍他乐克', status: 'completed', taskDate: today, completedAt: new Date(now.getTime() - 5 * 3600000) },
      { patientId: patients[2].id, planId: 3, taskType: 'monitoring', title: '测量心率', status: 'completed', taskDate: today, completedAt: new Date(now.getTime() - 4 * 3600000) },
      { patientId: patients[2].id, planId: 3, taskType: 'exercise', title: '快走30分钟', status: 'pending', taskDate: today },
    ]);
    // 陈晓燕的任务
    await this.taskRepo.save([
      { patientId: patients[3].id, planId: 4, taskType: 'medication', title: '服用美托洛尔', status: 'pending', taskDate: today },
      { patientId: patients[3].id, planId: 4, taskType: 'monitoring', title: '测量心率血压', status: 'pending', taskDate: today },
      { patientId: patients[3].id, planId: 4, taskType: 'exercise', title: '室内瑜伽20分钟', status: 'completed', taskDate: today, completedAt: new Date(now.getTime() - 1 * 3600000) },
    ]);

    console.log('患者端测试数据已初始化：1个账号，3个家庭成员，4套康复计划和任务');

    // ========== 医生端工作台种子数据 ==========
    const hoursLater = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);

    await this.reviewTaskRepo.save([
      {
        doctorId: doctor1.id, patientId: patients[0].id,
        taskType: 'high_risk_alert', priority: 1,
        alertId: wjgBpAlert?.id,
        title: '血压>182/115mmHg',
        description: '患者血压持续升高至182/115mmHg，需评估是否调整用药方案',
        context: JSON.stringify({ recentBP: ['182/115', '168/102', '155/95'], currentMeds: ['阿司匹林100mg', '卡托普利25mg'], recoveryStage: 'II' }),
        deadline: hoursLater(2),
      },
      {
        doctorId: doctor1.id, patientId: patients[3].id,
        taskType: 'high_risk_alert', priority: 1,
        alertId: cxyHrAlert?.id,
        title: '心率>128bpm',
        description: '患者心率突然飙升至128bpm，伴有心悸胸闷，需判断是否需要药物干预',
        context: JSON.stringify({ recentHR: ['128', '112', '105'], currentMeds: ['美托洛尔25mg'], recoveryStage: 'II' }),
        deadline: hoursLater(3),
      },
      {
        doctorId: doctor1.id, patientId: patients[1].id,
        taskType: 'high_risk_alert', priority: 1,
        alertId: lsfBpAlert?.id,
        title: '血压>185/120mmHg',
        description: '患者血压危急升高至185/120mmHg，伴头痛头晕、视物模糊，疑似高血压危象',
        context: JSON.stringify({ recentBP: ['185/120', '162/105', '152/94'], currentMeds: ['硝苯地平30mg', '缬沙坦80mg'], recoveryStage: 'I' }),
        deadline: hoursLater(1),
      },
      {
        doctorId: doctor1.id, patientId: patients[10].id,
        taskType: 'high_risk_alert', priority: 1,
        alertId: swjGlucoseAlert?.id,
        title: '血糖>16.8mmol/L',
        description: '患者餐后血糖严重超标至16.8mmol/L，近期血糖持续升高，需紧急调整降糖方案',
        context: JSON.stringify({ recentGlucose: ['16.8', '12.5', '10.3'], currentMeds: ['二甲双胍500mg', '格列美脲2mg'], recoveryStage: 'II' }),
        deadline: hoursLater(2),
      },
      {
        doctorId: doctor1.id, patientId: patients[11].id,
        taskType: 'high_risk_alert', priority: 1,
        alertId: mzqBpAlert?.id,
        title: '血压>178/112mmHg',
        description: '患者血压持续升高至178/112mmHg，收缩压接近180mmHg，需评估是否调整用药',
        context: JSON.stringify({ recentBP: ['178/112', '165/105', '158/100'], currentMeds: ['氨氯地平5mg', '厄贝沙坦150mg'], recoveryStage: 'III' }),
        deadline: hoursLater(3),
      },
      {
        doctorId: doctor1.id, patientId: patients[12].id,
        taskType: 'high_risk_alert', priority: 1,
        alertId: lxmGlucoseAlert?.id,
        title: '血糖>13.6mmol/L',
        description: '患者餐后血糖严重超标至13.6mmol/L，同时血压162/100mmHg，血糖血压双项异常',
        context: JSON.stringify({ recentGlucose: ['13.6', '9.8'], recentBP: ['162/100', '148/92'], currentMeds: ['阿卡波糖50mg', '缬沙坦80mg'], recoveryStage: 'II' }),
        deadline: hoursLater(4),
      },
      {
        doctorId: doctor1.id, patientId: patients[2].id,
        taskType: 'plan_adjustment', priority: 2,
        title: '张明辉康复计划III期调整审核',
        description: '系统建议将患者从III期（规律康复）调整运动强度，增加有氧训练时长',
        context: JSON.stringify({
          patientInfo: {
            height: 175, weight: 70, occupation: '退休',
            healthHistory: '高血压病史10年，冠心病术后恢复中',
          },
          dischargeDiagnosis: {
            admissionTime: '2025-11-25',
            dischargeTime: '2025-12-01',
            diagnosis: '冠心病，稳定型心绞痛，PCI术后',
            surgeryMethod: '经皮冠状动脉介入治疗（PCI）+ 支架植入术',
          },
          dischargeOrders: {
            medication: [
              { title: '倍他乐克', content: '25mg，每日1次，早餐后服用' },
              { title: '阿司匹林', content: '100mg，每日1次' },
            ],
            exercise: [
              { title: '快走训练', content: '每日20分钟，心率控制在100bpm以内' },
              { title: '呼吸训练', content: '腹式呼吸，每日2组，每组10次' },
            ],
            monitoring: [
              { title: '心率监测', content: '每日2次，运动前后各1次' },
              { title: '血压监测', content: '每日早晚各1次' },
            ],
            diet: [
              { title: '低盐饮食', content: '每日食盐<5g' },
            ],
            followUp: [
              { title: '心内科复诊', content: '每月1次' },
            ],
          },
          changeBasis: {
            triggerDescription: '患者近30天运动完成率达90%，心率恢复正常范围，系统建议提升运动强度',
            proposedChanges: [
              { field: '运动时长', from: '20分钟/次', to: '30分钟/次' },
              { field: '运动强度', from: '中等', to: '中等偏上' },
              { field: '运动频次', from: '每日1次', to: '每日1-2次' },
            ],
            supportingData: {
              recentAvgHR: '72bpm',
              exerciseCompletionRate: '90%',
              recentBPAvg: '128/82mmHg',
              stableDays: 21,
            },
          },
        }),
        deadline: hoursLater(24),
      },
      {
        doctorId: doctor1.id, patientId: patients[5].id,
        taskType: 'initial_plan', priority: 3,
        title: '赵丽颖初始康复计划审核',
        description: '新入组患者的初始康复计划待审核，需确认训练强度和用药方案',
        context: JSON.stringify({
          diseaseTags: ['冠心病', '高血压II级'],
          surgeryTags: ['PCI术后'],
          dischargeTime: '2026-02-28',
          patientInfo: {
            height: 165, weight: 58, occupation: '教师',
            healthHistory: '高血压病史5年，2型糖尿病病史3年',
          },
          dischargeDiagnosis: {
            admissionTime: '2026-02-20',
            dischargeTime: '2026-02-28',
            diagnosis: '冠状动脉粥样硬化性心脏病，不稳定型心绞痛，PCI术后',
            surgeryMethod: '经皮冠状动脉介入治疗（PCI）+ 支架植入术',
          },
          dischargeOrders: {
            exercise: [
              { title: '步行训练', content: '每日步行15-20分钟，心率控制在静息+20bpm以内' },
              { title: '呼吸训练', content: '腹式呼吸练习，每日3组，每组10次' },
            ],
            monitoring: [
              { title: '血压监测', content: '每日早晚各1次，记录收缩压/舒张压' },
              { title: '心率监测', content: '每日2次，运动前后各1次' },
              { title: '血糖监测', content: '空腹及餐后2小时，每周至少3天' },
            ],
            medication: [
              { title: '阿司匹林肠溶片', content: '100mg，每日1次，早餐后服用' },
              { title: '氯吡格雷', content: '75mg，每日1次，早餐后服用' },
              { title: '阿托伐他汀', content: '20mg，每晚1次，睡前服用' },
              { title: '美托洛尔缓释片', content: '47.5mg，每日1次，早餐后服用' },
            ],
            followUp: [
              { title: '心内科复诊', content: '术后1个月复查，携带出院小结' },
              { title: '心脏超声', content: '术后3个月复查心脏彩超' },
            ],
            diet: [
              { title: '低盐饮食', content: '每日食盐摄入<5g，避免腌制食品' },
              { title: '低脂饮食', content: '减少动物脂肪摄入，多食蔬果和优质蛋白' },
              { title: '控糖饮食', content: '控制主食量，避免高糖食物' },
            ],
          },
        }),
        deadline: hoursLater(48),
      },
      {
        doctorId: doctor1.id, patientId: patients[6].id,
        taskType: 'monthly_report', priority: 4,
        title: '周杰伦月度康复报告审核',
        description: '患者第3周期康复报告已生成，请审阅康复数据并确认下周期计划',
        context: JSON.stringify({
          cycleInfo: {
            cycleName: '第3周期',
            cycleRange: '2026-02-01 ~ 2026-02-28',
            totalCycles: 6,
            currentCycle: 3,
          },
          patientInfo: {
            height: 175,
            weight: 72,
            occupation: '音乐人',
            healthHistory: '冠心病, 2026年1月PCI术后',
          },
          recoveryData: {
            compliance: '92%',
            exerciseCompletion: '85%',
            avgBP: '128/82 mmHg',
            avgHR: '76 bpm',
            avgGlucose: '6.2 mmol/L',
            medicationAdherence: '95%',
            sleepQuality: '良好',
            weightChange: '-1.2kg',
            sixMinWalkDistance: '420m',
            phq9Score: '3分（轻微）',
          },
          recoverySummary: '患者周杰伦在第3周期（2月）康复整体表现良好。用药依从性保持在95%的高水平，运动处方完成率85%，血压控制在128/82mmHg，处于目标范围内。心率平均76bpm，血糖6.2mmol/L，均在正常范围。6分钟步行距离420m，较上周期提升15m，心肺功能持续改善。PHQ-9评分3分，心理状态稳定。体重较上周期下降1.2kg，BMI趋向正常。建议继续保持当前康复节奏。',
          nextCyclePlan: '第4周期（3月）计划调整：\n1. 运动处方：步行距离目标从每日5000步提升至6000步，增加每周2次低强度有氧操\n2. 用药方案：维持当前降压药剂量不变，继续观察\n3. 监测计划：血压监测频次由每日2次调整为每日1次（血压已稳定达标）\n4. 饮食管理：继续低盐低脂饮食，增加优质蛋白摄入\n5. 心理支持：维持当前状态，下周期末复评PHQ-9\n6. 复诊安排：3月15日心内科门诊复查',
        }),
        deadline: hoursLater(72),
      },
    ]);

    // 已审核任务（用于"已审核"列表展示）
    await this.reviewTaskRepo.save([
      {
        doctorId: doctor1.id, patientId: patients[7].id,
        taskType: 'initial_plan', priority: 3,
        title: '黄晓明初始康复计划审核',
        description: '新入组患者的初始康复计划待审核',
        context: JSON.stringify({
          diseaseTags: ['急性心梗', '高脂血症'],
          surgeryTags: ['CABG术后'],
          dischargeTime: '2026-02-15',
          patientInfo: { height: 178, weight: 75, occupation: '企业管理', healthHistory: '高脂血症病史8年' },
          dischargeDiagnosis: { admissionTime: '2026-02-05', dischargeTime: '2026-02-15', diagnosis: '急性心肌梗死，CABG术后', surgeryMethod: '冠状动脉旁路移植术（CABG）' },
          dischargeOrders: {
            exercise: [{ title: '床边活动', content: '每日3次，每次5-10分钟' }],
            monitoring: [{ title: '血压监测', content: '每日早晚各1次' }, { title: '心率监测', content: '每日3次' }],
            medication: [{ title: '阿司匹林', content: '100mg qd' }, { title: '瑞舒伐他汀', content: '10mg qn' }],
            followUp: [{ title: '心外科复诊', content: '术后2周复诊' }],
            diet: [{ title: '低脂低盐饮食', content: '清淡饮食为主' }],
          },
        }),
        status: 'approved',
        reviewComment: '同意入组，注意术后切口护理',
        reviewedAt: new Date(now.getTime() - 3 * 24 * 3600000),
        deadline: new Date(now.getTime() - 2 * 24 * 3600000),
      },
      {
        doctorId: doctor1.id, patientId: patients[8].id,
        taskType: 'high_risk_alert', priority: 1,
        title: '血压>175/110mmHg',
        description: '患者血压突增至175/110mmHg',
        context: JSON.stringify({ recentBP: ['175/110', '160/98'], currentMeds: ['氨氯地平5mg'] }),
        status: 'approved',
        reviewComment: '已调整用药方案，加用氢氯噻嗪12.5mg',
        reviewedAt: new Date(now.getTime() - 1 * 24 * 3600000),
        deadline: new Date(now.getTime() - 20 * 3600000),
      },
    ]);

    // 医患消息
    await this.messageRepo.save([
      { doctorId: doctor1.id, patientId: patients[0].id, messageType: 'text', direction: 'patient_to_doctor', content: '张医生，我今天血压有点高，头有点晕', isRead: false, createdAt: hoursAgo(1) },
      { doctorId: doctor1.id, patientId: patients[0].id, messageType: 'text', direction: 'patient_to_doctor', content: '刚才测了一下182/115，是不是需要加药？', isRead: false, createdAt: hoursAgo(0.5) },
      { doctorId: doctor1.id, patientId: patients[1].id, messageType: 'text', direction: 'patient_to_doctor', content: '医生，我今天餐后血糖14.2，是不是太高了', isRead: false, createdAt: hoursAgo(2) },
      { doctorId: doctor1.id, patientId: patients[1].id, messageType: 'text', direction: 'doctor_to_patient', content: '确实偏高，请注意饮食控制，减少主食摄入量', isRead: true, createdAt: hoursAgo(1.5) },
      { doctorId: doctor1.id, patientId: patients[1].id, messageType: 'text', direction: 'patient_to_doctor', content: '好的医生，那我晚上少吃点米饭', isRead: false, createdAt: hoursAgo(1) },
      { doctorId: doctor1.id, patientId: patients[2].id, messageType: 'text', direction: 'patient_to_doctor', content: '张医生，我想问一下现在可以开始慢跑了吗？', isRead: true, createdAt: hoursAgo(6) },
      { doctorId: doctor1.id, patientId: patients[2].id, messageType: 'text', direction: 'doctor_to_patient', content: '可以从快走开始，每次15-20分钟，注意心率不超过110bpm', isRead: true, createdAt: hoursAgo(5) },
      { doctorId: doctor1.id, patientId: patients[2].id, messageType: 'text', direction: 'patient_to_doctor', content: '明白了，谢谢张医生！', isRead: true, createdAt: hoursAgo(4.5) },
      { doctorId: doctor1.id, patientId: patients[3].id, messageType: 'text', direction: 'patient_to_doctor', content: '医生，我最近心跳总是很快，运动的时候更明显', isRead: false, createdAt: hoursAgo(3) },
      { doctorId: doctor1.id, patientId: patients[4].id, messageType: 'text', direction: 'doctor_to_patient', content: '刘先生，您的血压近期有波动，请坚持每日早晚各测一次', isRead: true, createdAt: daysAgo(1) },
      { doctorId: doctor1.id, patientId: patients[4].id, messageType: 'text', direction: 'patient_to_doctor', content: '好的张医生，我会坚持的', isRead: true, createdAt: daysAgo(1) },
    ]);

    console.log('医生端工作台数据已初始化：8条审核任务，11条医患消息');

    // ========== 医生收入种子数据 ==========
    await this.incomeRepo.save([
      { doctorId: doctor1.id, patientId: patients[0].id, category: 'monitoring', amount: 580, description: '王建国 3月监测管理费', settlementStatus: 'settled', incomeDate: daysAgo(2), settledAt: daysAgo(1) },
      { doctorId: doctor1.id, patientId: patients[1].id, category: 'monitoring', amount: 580, description: '李淑芬 3月监测管理费', settlementStatus: 'settled', incomeDate: daysAgo(2), settledAt: daysAgo(1) },
      { doctorId: doctor1.id, patientId: patients[2].id, category: 'monitoring', amount: 580, description: '张明辉 3月监测管理费', settlementStatus: 'settled', incomeDate: daysAgo(3), settledAt: daysAgo(2) },
      { doctorId: doctor1.id, patientId: patients[3].id, category: 'monitoring', amount: 580, description: '陈晓燕 3月监测管理费', settlementStatus: 'pending', incomeDate: daysAgo(1) },
      { doctorId: doctor1.id, patientId: patients[4].id, category: 'monitoring', amount: 580, description: '刘德华 3月监测管理费', settlementStatus: 'pending', incomeDate: daysAgo(1) },
      { doctorId: doctor1.id, patientId: patients[5].id, category: 'monitoring', amount: 580, description: '赵丽颖 3月监测管理费', settlementStatus: 'processing', incomeDate: daysAgo(1) },
      { doctorId: doctor1.id, patientId: patients[0].id, category: 'consultation', amount: 120, description: '王建国 在线咨询服务费', settlementStatus: 'pending', incomeDate: daysAgo(1) },
      { doctorId: doctor1.id, patientId: patients[1].id, category: 'consultation', amount: 120, description: '李淑芬 在线咨询服务费', settlementStatus: 'settled', incomeDate: daysAgo(3), settledAt: daysAgo(2) },
      { doctorId: doctor1.id, patientId: patients[3].id, category: 'consultation', amount: 120, description: '陈晓燕 在线咨询服务费', settlementStatus: 'settled', incomeDate: daysAgo(5), settledAt: daysAgo(4) },
      { doctorId: doctor1.id, patientId: patients[3].id, category: 'plan_review', amount: 200, description: '陈晓燕 康复计划审核费', settlementStatus: 'settled', incomeDate: daysAgo(3), settledAt: daysAgo(2) },
      { doctorId: doctor1.id, patientId: patients[5].id, category: 'plan_review', amount: 200, description: '赵丽颖 入组计划审核费', settlementStatus: 'pending', incomeDate: daysAgo(1) },
      { doctorId: doctor1.id, patientId: patients[6].id, category: 'report_review', amount: 150, description: '周杰伦 月度报告审核费', settlementStatus: 'processing', incomeDate: daysAgo(1) },
      { doctorId: doctor1.id, patientId: patients[7].id, category: 'report_review', amount: 150, description: '黄晓明 月度报告审核费', settlementStatus: 'settled', incomeDate: daysAgo(7), settledAt: daysAgo(6) },
      { doctorId: doctor1.id, patientId: patients[5].id, category: 'referral_bonus', amount: 100, description: '赵丽颖 入组推荐奖励', settlementStatus: 'settled', incomeDate: daysAgo(5), settledAt: daysAgo(4) },
      { doctorId: doctor1.id, patientId: patients[10].id, category: 'monitoring', amount: 580, description: '孙文静 3月监测管理费', settlementStatus: 'pending', incomeDate: daysAgo(1) },
    ]);

    console.log('医生收入数据已初始化：15条收入记录');
  }
}
