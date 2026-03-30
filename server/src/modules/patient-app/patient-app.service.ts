import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient, PatientAccount, FamilyMember, RecoveryPlan, RecoveryTask, HealthAlert, ConsultationSession } from '../../entities';

const STAGE_INFO: Record<string, { label: string; period: string; description: string }> = {
  I: { label: 'I期（术后早期，0-4周）', period: '0-4周', description: '床旁康复' },
  II: { label: 'II期（居家初期，4-8周）', period: '4-8周', description: '居家初期康复' },
  III: { label: 'III期（规律康复，8-12周）', period: '8-12周', description: '规律康复' },
  IV: { label: 'IV期（长期维持，12周以上）', period: '12周以上', description: '长期维持' },
};

// AI 模拟回复
const AI_REPLIES: Record<string, string> = {
  用药: '根据您的康复计划，请遵医嘱按时服药。阿司匹林建议饭后服用，如有不适请及时联系医生。日常注意观察有无出血倾向。',
  运动: '当前康复阶段建议进行低强度有氧运动，如散步15-30分钟。运动时心率不宜超过最大心率的60%。如感到胸闷、气促，请立即停止并休息。',
  血压: '建议每日固定时间测量血压，保持记录。正常范围：收缩压90-140mmHg，舒张压60-90mmHg。如连续多次超标，请及时就医。',
  血糖: '空腹血糖正常值为3.9-6.1mmol/L，餐后2小时血糖应低于7.8mmol/L。请注意控制饮食，少食多餐，避免高糖食物。',
  心率: '静息心率正常范围为60-100次/分。术后康复期间心率可能偏快，如持续超过100次/分或低于50次/分，请及时就医。',
  饮食: '建议低盐低脂饮食，每日盐摄入不超过6g。多食新鲜蔬果和优质蛋白，避免油炸、腌制食品。戒烟限酒，保持健康生活方式。',
  睡眠: '保持规律作息，建议每晚11点前入睡，保证7-8小时睡眠。睡前避免剧烈运动和使用电子设备。如有失眠问题，可尝试深呼吸放松。',
  预警: '如收到预警提示，请先保持冷静。低风险预警注意观察即可，中风险建议联系医生咨询，高风险请立即就医或拨打120。',
  报告: '您可以在首页"康复报告"入口查看最近的康复评估报告。报告内容包含体征趋势、用药依从性和康复进展评估。',
  default: '感谢您的咨询。根据您的情况，建议保持良好的生活习惯，按时服药和监测体征。如有具体问题，可以尝试询问关于用药、运动、血压、饮食等方面的问题。',
};

@Injectable()
export class PatientAppService {
  constructor(
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
    @InjectRepository(PatientAccount)
    private accountRepo: Repository<PatientAccount>,
    @InjectRepository(FamilyMember)
    private familyRepo: Repository<FamilyMember>,
    @InjectRepository(RecoveryPlan)
    private planRepo: Repository<RecoveryPlan>,
    @InjectRepository(RecoveryTask)
    private taskRepo: Repository<RecoveryTask>,
    @InjectRepository(HealthAlert)
    private alertRepo: Repository<HealthAlert>,
    @InjectRepository(ConsultationSession)
    private sessionRepo: Repository<ConsultationSession>,
  ) {}

  async getProfile(accountId: number) {
    const account = await this.accountRepo.findOne({ where: { id: accountId }, relations: ['patient'] });
    if (!account) return null;
    return {
      accountId: account.id,
      patientId: account.patientId,
      name: account.patient.name,
      phone: account.phone,
      nickname: account.nickname,
      gender: account.patient.gender,
      age: account.patient.age,
      currentIdentity: account.currentIdentity,
    };
  }

  async getIdentity(accountId: number) {
    const account = await this.accountRepo.findOne({ where: { id: accountId } });
    return { identity: account?.currentIdentity || 'patient' };
  }

  async switchIdentity(accountId: number, identity: 'patient' | 'family') {
    await this.accountRepo.update(accountId, { currentIdentity: identity });
    return { success: true };
  }

  async getHomeData(accountId: number) {
    const account = await this.accountRepo.findOne({ where: { id: accountId }, relations: ['patient'] });
    if (!account) return null;

    const patient = account.patient;
    const plan = await this.planRepo.findOne({ where: { patientId: patient.id, isActive: true } });
    const vitals = this.generateVitals(patient);
    const alerts = await this.getPatientAlerts(patient.id);
    const alertLevel = this.calculateAlertLevel(alerts);

    const today = new Date().toISOString().split('T')[0];
    const tasks = await this.taskRepo.find({ where: { patientId: patient.id, taskDate: today } });
    const completedCount = tasks.filter(t => t.status === 'completed').length;

    return {
      patient: {
        id: patient.id,
        name: patient.name,
        gender: patient.gender,
        age: patient.age,
      },
      recoveryStage: plan ? {
        stage: plan.stage,
        ...STAGE_INFO[plan.stage],
        surgeryDate: plan.surgeryDate,
      } : null,
      vitals,
      alertLevel,
      alerts: alerts.filter(a => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return new Date(a.alertTime) >= todayStart;
      }),
      tasks: tasks.map(t => ({
        id: t.id,
        taskType: t.taskType,
        title: t.title,
        status: t.status,
        completedAt: t.completedAt,
      })),
      completedCount,
      totalCount: tasks.length,
      reviewStatus: this.getPlanReviewStatus(patient.id),
    };
  }

  private generateVitals(patient: Patient) {
    // 模拟体征数据
    const hasRecentMeasure = patient.lastMeasureTime &&
      (new Date().getTime() - new Date(patient.lastMeasureTime).getTime()) < 48 * 3600 * 1000;

    if (!hasRecentMeasure) {
      return { heartRate: null, bloodPressure: null, bloodOxygen: null };
    }

    // 特定患者场景覆盖
    if (patient.id === 2) {
      // 李淑芬（妻子）：紧急场景 - 高血压危象
      return {
        heartRate: { value: 105, unit: 'bpm', status: 'abnormal' as const },
        bloodPressure: { value: '185/120', unit: 'mmHg', status: 'abnormal' as const },
        bloodOxygen: { value: 93, unit: '%', status: 'abnormal' as const },
      };
    }
    if (patient.id === 3) {
      // 张明辉（父亲）：正常场景 - 一切平稳
      return {
        heartRate: { value: 72, unit: 'bpm', status: 'normal' as const },
        bloodPressure: { value: '125/78', unit: 'mmHg', status: 'normal' as const },
        bloodOxygen: { value: 98, unit: '%', status: 'normal' as const },
      };
    }
    if (patient.id === 4) {
      // 陈晓燕（女儿）：紧急场景 - 心率突然飙升
      return {
        heartRate: { value: 128, unit: 'bpm', status: 'abnormal' as const },
        bloodPressure: { value: '138/90', unit: 'mmHg', status: 'normal' as const },
        bloodOxygen: { value: 94, unit: '%', status: 'abnormal' as const },
      };
    }

    const seed = patient.id * 7;
    return {
      heartRate: { value: 68 + (seed % 20), unit: 'bpm', status: 'normal' as const },
      bloodPressure: {
        value: `${120 + (seed % 30)}/${75 + (seed % 15)}`,
        unit: 'mmHg',
        status: (120 + (seed % 30)) > 140 ? 'abnormal' as const : 'normal' as const,
      },
      bloodOxygen: { value: 96 + (seed % 3), unit: '%', status: 'normal' as const },
    };
  }

  private calculateAlertLevel(alerts: HealthAlert[]): 'none' | 'low' | 'medium' | 'high' {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayAlerts = alerts.filter(a => new Date(a.alertTime) >= todayStart);

    if (todayAlerts.length === 0) return 'none';
    if (todayAlerts.some(a => a.level === 'danger')) return 'high';
    return 'medium';
  }

  async getPatientAlerts(patientId: number) {
    return this.alertRepo.find({
      where: { patientId },
      order: { alertTime: 'DESC' },
      take: 20,
    });
  }

  async getFamilyMembers(accountId: number) {
    const members = await this.familyRepo.find({
      where: { accountId },
      relations: ['patient'],
    });

    return Promise.all(members.map(async (m) => {
      const plan = await this.planRepo.findOne({ where: { patientId: m.patientId, isActive: true } });
      const alerts = await this.getPatientAlerts(m.patientId);
      const alertLevel = this.calculateAlertLevel(alerts);
      const vitals = this.generateVitals(m.patient);

      const today = new Date().toISOString().split('T')[0];
      const tasks = await this.taskRepo.find({ where: { patientId: m.patientId, taskDate: today } });
      const completedCount = tasks.filter(t => t.status === 'completed').length;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayAlerts = alerts.filter(a => new Date(a.alertTime) >= todayStart);

      return {
        id: m.id,
        patientId: m.patientId,
        name: m.patient.name,
        relationship: m.relationship,
        gender: m.patient.gender,
        age: m.patient.age,
        recoveryStage: plan ? { stage: plan.stage, ...STAGE_INFO[plan.stage] } : null,
        vitals,
        alertLevel,
        todayAlertCount: todayAlerts.length,
        latestAlertTime: alerts.length > 0 ? alerts[0].alertTime : null,
        taskProgress: { completed: completedCount, total: tasks.length },
      };
    }));
  }

  async getMemberDetail(patientId: number) {
    const patient = await this.patientRepo.findOne({ where: { id: patientId } });
    if (!patient) return null;

    const plan = await this.planRepo.findOne({ where: { patientId, isActive: true } });
    const vitals = this.generateVitals(patient);
    const alerts = await this.getPatientAlerts(patientId);
    const alertLevel = this.calculateAlertLevel(alerts);

    const today = new Date().toISOString().split('T')[0];
    const tasks = await this.taskRepo.find({ where: { patientId, taskDate: today } });

    // 查找家庭关系
    const familyRecord = await this.familyRepo.findOne({ where: { patientId } });

    // 计算康复天数
    const surgeryDate = plan?.surgeryDate ? new Date(plan.surgeryDate) : null;
    const recoveryDays = surgeryDate
      ? Math.max(0, Math.floor((Date.now() - surgeryDate.getTime()) / 86400000))
      : 0;

    // 血糖血氧模拟
    const bloodSugar = (4.5 + (patient.id * 3 % 30) / 10).toFixed(1);
    const bloodOxygen = 96 + (patient.id * 7 % 3);

    return {
      patient: { id: patient.id, name: patient.name, gender: patient.gender, age: patient.age },
      relationship: familyRecord?.relationship || '家属',
      recoveryStage: plan ? { stage: plan.stage, ...STAGE_INFO[plan.stage], surgeryDate: plan.surgeryDate } : null,
      vitals: {
        ...vitals,
        bloodSugar: { value: bloodSugar, unit: 'mmol/L', status: parseFloat(bloodSugar) > 6.1 ? 'abnormal' as const : 'normal' as const },
        bloodOxygen: vitals.bloodOxygen || { value: bloodOxygen, unit: '%', status: bloodOxygen < 95 ? 'abnormal' as const : 'normal' as const },
      },
      alertLevel,
      alerts: alerts.slice(0, 10).map(a => ({
        id: a.id, alertType: a.alertType, value: a.value, unit: a.unit,
        level: a.level, description: a.description, alertTime: a.alertTime,
      })),
      tasks: tasks.map(t => ({ id: t.id, taskType: t.taskType, title: t.title, status: t.status })),
      emergencyContacts: {
        ambulance: '120',
        doctor: '张医生 · 13800138000',
        hospital: '兰州大学第一医院心内科',
      },
      planSummary: plan ? {
        stage: plan.stage,
        stageInfo: STAGE_INFO[plan.stage],
        surgeryDate: plan.surgeryDate,
        description: plan.description,
        recoveryDays,
      } : null,
      recoveryDays,
    };
  }

  async getTasks(patientId: number) {
    const today = new Date().toISOString().split('T')[0];
    return this.taskRepo.find({ where: { patientId, taskDate: today }, order: { createdAt: 'ASC' } });
  }

  async checkInTask(taskId: number, accountId: number) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) return null;
    task.status = 'completed';
    task.completedAt = new Date();
    task.completedBy = accountId;
    await this.taskRepo.save(task);
    return { success: true, task };
  }

  async getRecoveryPlan(patientId: number) {
    const plan = await this.planRepo.findOne({ where: { patientId, isActive: true } });
    if (!plan) return null;
    return {
      ...plan,
      stageInfo: STAGE_INFO[plan.stage],
      allStages: [
        { stage: 'I', ...STAGE_INFO['I'] },
        { stage: 'II', ...STAGE_INFO['II'] },
        { stage: 'III', ...STAGE_INFO['III'] },
        { stage: 'IV', ...STAGE_INFO['IV'] },
      ],
    };
  }

  async sendConsultation(accountId: number, patientId: number, message: string, type: 'ai' | 'doctor') {
    let reply: string;

    if (type === 'ai') {
      // 关键词匹配模拟回复
      const matchedKey = Object.keys(AI_REPLIES).find(key => key !== 'default' && message.includes(key));
      reply = AI_REPLIES[matchedKey || 'default'];
    } else {
      reply = '医生咨询功能正在接入中，目前可使用AI智能咨询获取康复建议。如遇紧急情况，请直接联系您的主治医生或拨打120。';
    }

    const now = new Date().toISOString();
    const messages = [
      { role: 'user' as const, content: message, timestamp: now },
      { role: 'assistant' as const, content: reply, timestamp: new Date(Date.now() + 1000).toISOString() },
    ];

    // 查找或创建会话
    let session = await this.sessionRepo.findOne({
      where: { accountId, patientId, consultationType: type },
      order: { updatedAt: 'DESC' },
    });

    if (session) {
      session.messages = [...(session.messages || []), ...messages];
      await this.sessionRepo.save(session);
    } else {
      session = await this.sessionRepo.save({
        accountId, patientId, consultationType: type, messages,
      });
    }

    return { reply, session };
  }

  async getConsultationHistory(accountId: number) {
    return this.sessionRepo.find({
      where: { accountId },
      order: { updatedAt: 'DESC' },
      take: 10,
    });
  }

  async getLifeAsset(accountId: number) {
    const account = await this.accountRepo.findOne({ where: { id: accountId }, relations: ['patient'] });
    if (!account) return null;

    const patient = account.patient;
    const plan = await this.planRepo.findOne({ where: { patientId: patient.id, isActive: true } });
    const alerts = await this.getPatientAlerts(patient.id);
    const alertLevel = this.calculateAlertLevel(alerts);

    // 计算术后天数
    const surgeryDate = plan?.surgeryDate ? new Date(plan.surgeryDate) : new Date(Date.now() - 45 * 86400000);
    const recoveryDays = Math.max(0, Math.floor((Date.now() - surgeryDate.getTime()) / 86400000));

    // 判断是否处于高风险熔断态
    const isHighRisk = alertLevel === 'high';

    // T+1 模拟每日雷达评分（基于 seed 模拟稳定数据）
    const seed = patient.id * 13;
    const physiological = isHighRisk ? 0 : Math.min(30, 22 + (seed % 9));     // 生理性资产 (30分)
    const compliance = Math.min(25, 18 + ((seed * 3) % 8));                     // 依从性资产 (25分)
    const behavioral = Math.min(20, 12 + ((seed * 7) % 9));                     // 行为性资产 (20分)
    const nutrition = Math.min(15, 10 + ((seed * 11) % 6));                     // 营养资产 (15分)
    const emotional = Math.min(10, 7 + ((seed * 17) % 4));                      // 情绪资产 (10分)

    const dailyScore = physiological + compliance + behavioral + nutrition + emotional;

    // 里程碑闯关制：根据术后天数确定当前里程碑
    const milestones = [
      { days: 30, dividend: 0.5, nextTarget: 1.0 },
      { days: 60, dividend: 1.0, nextTarget: 1.5 },
      { days: 90, dividend: 1.5, nextTarget: 2.0 },
      { days: 180, dividend: 2.5, nextTarget: 3.5 },
    ];

    let currentDividend = 0;
    let nextTarget = 0.5;
    let nextMilestoneDays = 30;
    let currentMilestoneIndex = -1;

    for (let i = 0; i < milestones.length; i++) {
      if (recoveryDays >= milestones[i].days && dailyScore >= 70) {
        currentDividend = milestones[i].dividend;
        nextTarget = milestones[i].nextTarget;
        currentMilestoneIndex = i;
      }
    }

    // 计算距下一里程碑天数
    const nextMilestone = milestones[currentMilestoneIndex + 1];
    if (nextMilestone) {
      nextMilestoneDays = Math.max(0, nextMilestone.days - recoveryDays);
    } else {
      nextMilestoneDays = 0;
    }

    // 进度条百分比（当前里程碑内进度）
    const prevDays = currentMilestoneIndex >= 0 ? milestones[currentMilestoneIndex].days : 0;
    const targetDays = nextMilestone ? nextMilestone.days : milestones[milestones.length - 1].days;
    const progressPct = nextMilestone
      ? Math.min(100, Math.floor((recoveryDays - prevDays) / (targetDays - prevDays) * 100))
      : 100;

    return {
      patientName: patient.name,
      recoveryDays,
      isHighRisk,
      dividend: {
        value: currentDividend,
        nextTarget,
        nextMilestoneDays,
        progressPct,
        qualified: dailyScore >= 85,
      },
      radar: {
        physiological: { score: physiological, max: 30, label: '生理性资产', desc: physiological >= 25 ? '昨日体征稳定，未触发预警' : '体征波动，注意观察' },
        compliance: { score: compliance, max: 25, label: '依从性资产', desc: compliance >= 20 ? '用药/监测按时完成，表现优秀' : '部分任务未按时完成' },
        behavioral: { score: behavioral, max: 20, label: '行为性资产', desc: behavioral >= 15 ? '康复运动达标，靶心率区间良好' : '运动量不足，建议增加跟练' },
        nutrition: { score: nutrition, max: 15, label: '营养资产', desc: nutrition >= 12 ? '三餐打卡合规，低盐低脂达标' : '饮食有待改善' },
        emotional: { score: emotional, max: 10, label: '情绪资产', desc: emotional >= 8 ? '深度睡眠达标，情绪状态良好' : '睡眠质量待提升' },
      },
      dailyScore,
    };
  }

  async getVitalHistory(patientId: number, type: string) {
    const patient = await this.patientRepo.findOne({ where: { id: patientId } });
    if (!patient) return null;

    const seed = patient.id * 7;
    const now = new Date();
    const records: Array<{ date: string; time: string; value: string; unit: string; riskTag: string; riskLevel: string }> = [];

    // 生成近7天数据，每天1-2条
    for (let d = 0; d < 7; d++) {
      const day = new Date(now.getTime() - d * 86400000);
      const dateStr = `${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      const timesPerDay = 1 + ((seed + d) % 2); // 1 or 2 records per day

      for (let t = 0; t < timesPerDay; t++) {
        const hour = t === 0 ? 8 + ((seed + d) % 3) : 14 + ((seed + d) % 4);
        const minute = (seed * (d + 1) * (t + 1)) % 60;
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

        let value: string, unit: string, riskTag: string, riskLevel: string;

        switch (type) {
          case 'heartRate': {
            const v = 62 + ((seed + d * 3 + t * 7) % 40);
            value = String(v);
            unit = 'bpm';
            if (v > 100) { riskTag = '偏高'; riskLevel = 'high'; }
            else if (v < 60) { riskTag = '偏低'; riskLevel = 'low'; }
            else { riskTag = '正常'; riskLevel = 'normal'; }
            break;
          }
          case 'bloodPressure': {
            const sys = 115 + ((seed + d * 5 + t * 11) % 35);
            const dia = 70 + ((seed + d * 3 + t * 7) % 20);
            value = `${sys}/${dia}`;
            unit = 'mmHg';
            if (sys > 140) { riskTag = '偏高'; riskLevel = 'high'; }
            else { riskTag = '正常'; riskLevel = 'normal'; }
            break;
          }
          case 'bloodSugar': {
            const v = 3.8 + ((seed + d * 7 + t * 3) % 30) / 10;
            value = v.toFixed(1);
            unit = 'mmol/L';
            if (v > 6.1) { riskTag = '偏高'; riskLevel = 'high'; }
            else if (v < 3.9) { riskTag = '偏低'; riskLevel = 'low'; }
            else { riskTag = '正常'; riskLevel = 'normal'; }
            break;
          }
          case 'bloodOxygen': {
            const v = 93 + ((seed + d * 2 + t * 5) % 6);
            value = String(v);
            unit = '%';
            if (v < 95) { riskTag = '偏低'; riskLevel = 'low'; }
            else { riskTag = '正常'; riskLevel = 'normal'; }
            break;
          }
          case 'weight': {
            const v = parseFloat((60 + (seed % 25) + ((d * 3 + t * 7) % 10 - 5) / 10).toFixed(1));
            value = String(v);
            unit = 'kg';
            if (v > 80) { riskTag = '偏高'; riskLevel = 'high'; }
            else if (v < 50) { riskTag = '偏低'; riskLevel = 'low'; }
            else { riskTag = '正常'; riskLevel = 'normal'; }
            break;
          }
          default:
            value = '--';
            unit = '';
            riskTag = '--';
            riskLevel = 'normal';
        }

        records.push({ date: dateStr, time: timeStr, value, unit, riskTag, riskLevel });
      }
    }

    // AI 趋势分析文案
    const aiSummaries: Record<string, string> = {
      heartRate: `近7日心率均值${68 + (seed % 12)}bpm，波动范围${62 + (seed % 8)}-${78 + (seed % 15)}bpm，整体平稳。建议继续保持规律作息，避免剧烈运动后立即测量。`,
      bloodPressure: `近7日收缩压均值${122 + (seed % 10)}mmHg，舒张压均值${76 + (seed % 8)}mmHg，血压控制良好。建议每日固定时间测量，保持低盐饮食。`,
      bloodSugar: `近7日空腹血糖均值${(4.5 + (seed % 15) / 10).toFixed(1)}mmol/L，波动在正常范围内。建议继续控制碳水摄入，规律三餐。`,
      bloodOxygen: `近7日血氧饱和度均值${96 + (seed % 2)}%，整体稳定。如出现胸闷气短，请及时测量并联系医生。`,
      weight: `近7日体重均值${(60 + (seed % 25)).toFixed(1)}kg，波动范围±0.5kg，体重控制稳定。建议保持均衡饮食，配合适量运动。`,
    };

    return {
      records,
      aiSummary: aiSummaries[type] || '暂无趋势分析数据',
    };
  }

  // ========== 康复计划详情 ==========

  async getRecoveryPlanDetail(patientId: number) {
    const patient = await this.patientRepo.findOne({ where: { id: patientId } });
    if (!patient) return null;

    const plan = await this.planRepo.findOne({ where: { patientId, isActive: true } });
    if (!plan) return null;

    const surgeryDate = new Date(plan.surgeryDate);
    const recoveryDays = Math.max(0, Math.floor((Date.now() - surgeryDate.getTime()) / 86400000));

    // 四阶段里程碑
    const milestones = [
      {
        stage: 'I', label: 'I期 · 术后早期', period: '0-4周',
        description: '床旁康复期，以卧床休息为主，逐步恢复基本活动能力。',
        goals: ['术后伤口愈合观察', '基础生命体征稳定', '床上主被动活动', '深呼吸训练'],
        startDay: 0, endDay: 28,
      },
      {
        stage: 'II', label: 'II期 · 居家初期', period: '4-8周',
        description: '居家康复初期，开始规律监测体征，配合低强度运动。',
        goals: ['每日规律监测血压/心率', '低强度散步(10-15分钟)', '按时服药依从性>90%', '低盐低脂饮食调整'],
        startDay: 28, endDay: 56,
      },
      {
        stage: 'III', label: 'III期 · 规律康复', period: '8-12周',
        description: '增加运动量和康复训练强度，建立长期健康习惯。',
        goals: ['中等强度有氧运动(30分钟)', '靶心率区间训练', '营养三餐规律打卡', '心理舒缓与睡眠管理'],
        startDay: 56, endDay: 84,
      },
      {
        stage: 'IV', label: 'IV期 · 长期维持', period: '12周以上',
        description: '保持良好康复习惯，实现自主健康管理。',
        goals: ['持续规律运动', '稳定体征自我监测', '定期复查计划', '生命资产持续增值'],
        startDay: 84, endDay: 365,
      },
    ];

    const currentMilestone = milestones.find(m => {
      const stageMap: Record<string, string> = { I: 'I', II: 'II', III: 'III', IV: 'IV' };
      return stageMap[plan.stage] === m.stage;
    }) || milestones[0];

    // 计算当前阶段内进度
    const daysInStage = recoveryDays - currentMilestone.startDay;
    const stageDuration = currentMilestone.endDay - currentMilestone.startDay;
    const stageProgress = Math.min(100, Math.max(0, Math.floor(daysInStage / stageDuration * 100)));

    return {
      patient: { id: patient.id, name: patient.name },
      plan: {
        id: plan.id, stage: plan.stage, surgeryDate: plan.surgeryDate,
        description: plan.description, isActive: plan.isActive,
      },
      recoveryDays,
      milestones: milestones.map(m => ({
        ...m,
        status: recoveryDays >= m.endDay ? 'completed' as const
          : recoveryDays >= m.startDay ? 'current' as const
          : 'future' as const,
      })),
      currentStage: {
        ...currentMilestone,
        progress: stageProgress,
        daysInStage: Math.max(0, daysInStage),
      },
      // 计划变更审核 mock
      reviewStatus: this.getPlanReviewStatus(patientId),
    };
  }

  // 模拟计划审核状态
  private planReviewState: Record<number, { status: string; updatedAt: string; changes?: any }> = {};

  private getPlanReviewStatus(patientId: number) {
    const state = this.planReviewState[patientId];
    if (state) return state;
    // 默认无审核
    return null;
  }

  async triggerPlanReview(patientId: number) {
    this.planReviewState[patientId] = {
      status: 'reviewing',
      updatedAt: new Date().toISOString(),
      changes: {
        reason: '主治医师根据近期体征数据调整康复方案',
        oldStage: 'II',
        newStage: 'II',
        adjustments: [
          { type: 'exercise', desc: '运动强度由低强度调整为中低强度，散步时间延长至20分钟' },
          { type: 'medication', desc: '新增辅酶Q10每日1次' },
          { type: 'monitoring', desc: '血压监测频次由每日1次调整为每日2次（早晚各1次）' },
        ],
        doctorNote: '患者近期血压控制良好，心率稳定在正常范围内，可适当提升康复运动强度。建议增加辅酶Q10改善心肌代谢。',
      },
    };
    return { success: true, status: 'reviewing' };
  }

  async approvePlanReview(patientId: number) {
    if (this.planReviewState[patientId]) {
      this.planReviewState[patientId].status = 'approved';
      this.planReviewState[patientId].updatedAt = new Date().toISOString();
    }
    return { success: true, status: 'approved' };
  }

  async acceptPlanChanges(patientId: number) {
    delete this.planReviewState[patientId];
    return { success: true };
  }

  // ========== 康复日历 ==========

  async getRecoveryCalendar(patientId: number, month: string) {
    const plan = await this.planRepo.findOne({ where: { patientId, isActive: true } });
    const seed = patientId * 13;

    // 解析月份
    const [year, mon] = month.split('-').map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();
    const surgeryDate = plan?.surgeryDate ? new Date(plan.surgeryDate) : new Date(Date.now() - 45 * 86400000);

    const days: Array<{
      date: string; dayOfMonth: number; hasData: boolean;
      recoveryDay: number; stage: string;
      taskCount: number; completedCount: number;
    }> = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(date);
      const recoveryDay = Math.max(0, Math.floor((dayDate.getTime() - surgeryDate.getTime()) / 86400000));
      const isPast = dayDate <= new Date();

      let stage = 'I';
      if (recoveryDay >= 84) stage = 'IV';
      else if (recoveryDay >= 56) stage = 'III';
      else if (recoveryDay >= 28) stage = 'II';

      // 模拟每天3个任务
      const taskCount = isPast && recoveryDay >= 0 ? 3 : 0;
      const completedSeed = (seed + d * 7) % 10;
      const completedCount = isPast && recoveryDay >= 0
        ? (completedSeed < 3 ? 2 : completedSeed < 7 ? 3 : 1) : 0;

      days.push({
        date, dayOfMonth: d, hasData: isPast && recoveryDay >= 0,
        recoveryDay, stage, taskCount, completedCount,
      });
    }

    return {
      month,
      surgeryDate: plan?.surgeryDate || null,
      currentStage: plan?.stage || 'I',
      days,
    };
  }

  // ========== 某日任务详情 ==========

  async getDayDetail(patientId: number, date: string) {
    const seed = patientId * 7;
    const dayNum = parseInt(date.split('-')[2], 10);
    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;

    // 如果是今天，返回真实任务数据
    if (isToday) {
      const tasks = await this.taskRepo.find({ where: { patientId, taskDate: today }, order: { createdAt: 'ASC' } });
      const completed = tasks.filter(t => t.status === 'completed').length;
      return {
        date,
        tasks: tasks.map(t => ({
          id: t.id, taskType: t.taskType, title: t.title,
          status: t.status, completedAt: t.completedAt,
        })),
        completedCount: completed,
        totalCount: tasks.length,
        aiSummary: this.generateDaySummary(patientId, date, completed, tasks.length),
      };
    }

    // 历史日期模拟
    const completedSeed = (seed + dayNum * 7) % 10;
    const completedCount = completedSeed < 3 ? 2 : completedSeed < 7 ? 3 : 1;
    const mockTasks = [
      { id: dayNum * 100 + 1, taskType: 'monitoring', title: '测量血压并记录', status: completedCount >= 1 ? 'completed' : 'missed', completedAt: completedCount >= 1 ? `${date}T08:30:00Z` : null },
      { id: dayNum * 100 + 2, taskType: 'exercise', title: '康复运动跟练', status: completedCount >= 2 ? 'completed' : 'missed', completedAt: completedCount >= 2 ? `${date}T15:00:00Z` : null },
      { id: dayNum * 100 + 3, taskType: 'medication', title: '晚间用药确认', status: completedCount >= 3 ? 'completed' : 'missed', completedAt: completedCount >= 3 ? `${date}T20:15:00Z` : null },
    ];

    return {
      date,
      tasks: mockTasks,
      completedCount,
      totalCount: 3,
      aiSummary: this.generateDaySummary(patientId, date, completedCount, 3),
    };
  }

  private generateDaySummary(_patientId: number, _date: string, completed: number, total: number): string {
    const rate = total > 0 ? Math.floor(completed / total * 100) : 0;
    if (rate === 100) return `当日${total}项康复任务全部完成，依从性100%，表现优秀！体征数据平稳，请继续保持。`;
    if (rate >= 60) return `当日完成${completed}/${total}项任务，依从性${rate}%。部分任务未完成，建议合理安排时间，确保康复进度。`;
    return `当日仅完成${completed}/${total}项任务，依从性偏低。请重视康复计划执行，规律的康复训练对恢复至关重要。`;
  }

  // ========== AI 报告 ==========

  async getRecoveryReport(patientId: number, type: 'daily' | 'weekly' | 'monthly', date: string) {
    const seed = patientId * 11;
    const patient = await this.patientRepo.findOne({ where: { id: patientId } });
    const plan = await this.planRepo.findOne({ where: { patientId, isActive: true } });
    const stageInfo = plan ? STAGE_INFO[plan.stage] : null;

    if (type === 'daily') {
      return {
        type: 'daily',
        date,
        title: `${date.replace(/-/g, '.')} 康复日报`,
        sections: [
          {
            title: '体征概览',
            content: `心率均值${68 + (seed % 15)}bpm，血压${120 + (seed % 12)}/${75 + (seed % 8)}mmHg，血氧${96 + (seed % 3)}%，整体平稳。`,
          },
          {
            title: '任务完成',
            content: `今日3项康复任务已完成${2 + (seed % 2)}项，用药准时率${85 + (seed % 15)}%。`,
          },
          {
            title: 'AI 建议',
            content: '建议明日增加5分钟散步时间，逐步提升运动量。注意保持充足睡眠，避免情绪波动。',
          },
        ],
        overallScore: 78 + (seed % 18),
      };
    }

    if (type === 'weekly') {
      return {
        type: 'weekly',
        date,
        title: `本周康复周报`,
        reviewed: true,
        reviewedAt: new Date(new Date(date).getTime() + 2 * 86400000).toISOString().split('T')[0],
        reviewDoctor: { name: '张伟', title: '主任医师', department: '心内科' },
        doctorComment: `${patient?.name || '患者'}本周康复表现良好，体征数据平稳。建议继续坚持当前运动方案，注意监测运动后心率恢复情况。如有不适请及时联系我。`,
        sections: [
          {
            title: '本周总结',
            content: `本周处于${stageInfo?.label || '康复'}阶段，共完成康复任务${15 + (seed % 6)}项，完成率${80 + (seed % 15)}%。`,
          },
          {
            title: '体征趋势',
            content: `心率7日均值${70 + (seed % 10)}bpm，较上周${seed % 2 === 0 ? '下降' : '持平'}；血压控制稳定，未触发预警。`,
          },
          {
            title: '运动表现',
            content: `本周累计有效运动${60 + (seed % 30)}分钟，靶心率达标${3 + (seed % 4)}次。${seed % 3 === 0 ? '运动量达标，继续保持！' : '建议适当增加运动频次。'}`,
          },
          {
            title: '下周计划',
            content: '建议下周尝试增加运动时间至每次20分钟，保持用药规律，关注睡眠质量。',
          },
        ],
        overallScore: 75 + (seed % 20),
      };
    }

    // monthly
    return {
      type: 'monthly',
      date,
      title: `本月康复月报`,
      reviewed: true,
      reviewedAt: new Date(new Date(date).getTime() + 5 * 86400000).toISOString().split('T')[0],
      reviewDoctor: { name: '张伟', title: '主任医师', department: '心内科' },
      doctorComment: `${patient?.name || '患者'}本月康复进展稳健，各项指标趋于稳定。生命资产评分持续上升，依从性表现优秀。下月可考虑逐步进入下一阶段康复训练，增加运动强度。继续保持良好的生活习惯和服药规律。`,
      sections: [
        {
          title: '月度总结',
          content: `本月累计完成${55 + (seed % 15)}项康复任务，总体依从性${78 + (seed % 18)}%，较上月${seed % 2 === 0 ? '提升3%' : '基本持平'}。`,
        },
        {
          title: '康复进展',
          content: `当前处于${stageInfo?.label || '康复阶段'}，体征数据整体趋于稳定，生命资产评分稳步上升。`,
        },
        {
          title: '风险评估',
          content: `本月共触发${seed % 3}次体征预警，均为低风险级别，整体风险可控。`,
        },
      ],
      overallScore: 72 + (seed % 22),
    };
  }

  // ========== 全成员预警历史 ==========

  async getAllAlertHistory(accountId: number) {
    const account = await this.accountRepo.findOne({ where: { id: accountId }, relations: ['patient'] });
    if (!account) return [];

    const members = await this.familyRepo.find({ where: { accountId }, relations: ['patient'] });
    const allPatientIds = [account.patientId, ...members.map(m => m.patientId)];

    const alerts = await this.alertRepo.find({
      where: allPatientIds.map(pid => ({ patientId: pid })),
      order: { alertTime: 'DESC' },
      take: 50,
    });

    const memberMap = new Map<number, { name: string; relationship: string }>();
    memberMap.set(account.patientId, { name: account.patient.name, relationship: '本人' });
    for (const m of members) {
      memberMap.set(m.patientId, { name: m.patient.name, relationship: m.relationship });
    }

    return alerts.map(a => ({
      id: a.id,
      patientId: a.patientId,
      alertType: a.alertType,
      value: a.value,
      unit: a.unit,
      level: a.level,
      description: a.description,
      alertTime: a.alertTime,
      memberName: memberMap.get(a.patientId)?.name || '未知',
      relationship: memberMap.get(a.patientId)?.relationship || '',
    }));
  }

  // ========== 消息通知 ==========

  async getNotifications(accountId: number) {
    const account = await this.accountRepo.findOne({ where: { id: accountId }, relations: ['patient'] });
    if (!account) return { unreadCount: 0, items: [] };

    const items: Array<{ id: string; type: string; title: string; body: string; time: string; read: boolean }> = [];

    // 1. 计划审核通知
    const reviewState = this.getPlanReviewStatus(account.patientId);
    if (reviewState) {
      items.push({
        id: `review-${account.patientId}`,
        type: 'plan_review',
        title: reviewState.status === 'reviewing' ? '康复计划变更审核中' : '计划变更已通过',
        body: reviewState.status === 'reviewing'
          ? '医生正在审核您的康复计划调整方案'
          : '医生已审核通过新的康复方案，点击查看变更内容',
        time: reviewState.updatedAt,
        read: false,
      });
    }

    // 2. 家属预警通知
    const members = await this.familyRepo.find({ where: { accountId }, relations: ['patient'] });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    for (const m of members) {
      const alerts = await this.getPatientAlerts(m.patientId);
      const todayAlerts = alerts.filter(a => new Date(a.alertTime) >= todayStart);
      if (todayAlerts.length > 0) {
        const latest = todayAlerts[0];
        items.push({
          id: `family-alert-${m.patientId}`,
          type: 'family_alert',
          title: `${m.relationship}${m.patient.name}健康预警`,
          body: latest.description,
          time: latest.alertTime.toISOString(),
          read: false,
        });
      }
    }

    return { unreadCount: items.length, items };
  }

  // ========== 健康排名 ==========

  async getHealthRank(accountId: number) {
    const account = await this.accountRepo.findOne({ where: { id: accountId }, relations: ['patient'] });
    if (!account) return null;

    const patient = account.patient;
    const plan = await this.planRepo.findOne({ where: { patientId: patient.id, isActive: true } });
    const seed = patient.id * 13;

    const recoveryDays = plan?.surgeryDate
      ? Math.max(0, Math.floor((Date.now() - new Date(plan.surgeryDate).getTime()) / 86400000))
      : 45;
    const overallPercentile = Math.min(95, Math.floor(50 + recoveryDays * 0.5));

    const criteria = [
      {
        key: 'compliance', label: '用药依从性',
        myScore: Math.min(100, 75 + (seed % 20)), peerAvg: 68, unit: '%',
        desc: '按时服药打卡的完成率',
        tip: '坚持每日按时服药，可显著提升此项评分',
      },
      {
        key: 'monitoring', label: '监测规律性',
        myScore: Math.min(100, 70 + ((seed * 3) % 25)), peerAvg: 62, unit: '%',
        desc: '每日体征监测的坚持率',
        tip: '每天固定时间测量血压和心率，养成习惯',
      },
      {
        key: 'exercise', label: '运动达标率',
        myScore: Math.min(100, 55 + ((seed * 7) % 30)), peerAvg: 48, unit: '%',
        desc: '靶心率区间内有效运动的比例',
        tip: '循序渐进增加运动时间，保持在靶心率区间内',
      },
      {
        key: 'vitals', label: '体征稳定性',
        myScore: Math.min(100, 65 + ((seed * 11) % 25)), peerAvg: 58, unit: '分',
        desc: '血压、心率、血糖等指标的波动程度',
        tip: '规律作息、情绪管理有助于体征保持平稳',
      },
      {
        key: 'nutrition', label: '饮食管理',
        myScore: Math.min(100, 60 + ((seed * 17) % 30)), peerAvg: 52, unit: '分',
        desc: '低盐低脂饮食的达标程度',
        tip: '坚持三餐拍照记录，AI分析帮助改善饮食结构',
      },
      {
        key: 'sleep', label: '睡眠质量',
        myScore: Math.min(100, 70 + ((seed * 23) % 20)), peerAvg: 65, unit: '分',
        desc: '深度睡眠时长和规律性',
        tip: '睡前避免使用电子设备，保持卧室环境舒适',
      },
    ];

    const stageLabel = plan ? STAGE_INFO[plan.stage]?.label : '康复中';
    const peerGroup = `${patient.age}岁${patient.gender === 'male' ? '男性' : '女性'} · ${stageLabel}`;

    return {
      patientName: patient.name,
      overallPercentile,
      peerGroup,
      recoveryDays,
      criteria,
      aiSummary: `${patient.name}在同期康复患者中表现${overallPercentile >= 70 ? '优秀' : overallPercentile >= 50 ? '良好' : '尚需加强'}，综合排名超越${overallPercentile}%的同龄同阶段患者。${overallPercentile >= 70 ? '请继续保持当前良好的康复节奏！' : '建议加强运动达标率和饮食管理，可有效提升排名。'}`,
    };
  }
}
