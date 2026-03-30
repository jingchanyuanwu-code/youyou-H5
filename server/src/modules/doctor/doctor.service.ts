import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import {
  Doctor, Patient, DoctorPatientRel, Activity, HealthAlert,
  DoctorReviewTask, DoctorMessage, AlertIntervention, DoctorIncome,
} from '../../entities';
import { AlertType, PatientStatus } from '../../entities/health-alert.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
    @InjectRepository(DoctorPatientRel)
    private relRepo: Repository<DoctorPatientRel>,
    @InjectRepository(Activity)
    private activityRepo: Repository<Activity>,
    @InjectRepository(HealthAlert)
    private alertRepo: Repository<HealthAlert>,
    @InjectRepository(DoctorReviewTask)
    private reviewTaskRepo: Repository<DoctorReviewTask>,
    @InjectRepository(DoctorMessage)
    private messageRepo: Repository<DoctorMessage>,
    @InjectRepository(AlertIntervention)
    private interventionRepo: Repository<AlertIntervention>,
    @InjectRepository(DoctorIncome)
    private incomeRepo: Repository<DoctorIncome>,
  ) {}

  async getProfile(doctorId: number): Promise<Doctor | null> {
    return this.doctorRepo.findOne({ where: { id: doctorId } });
  }

  // 计算患者状态
  private calculatePatientStatus(
    patient: Patient,
    alerts: HealthAlert[],
  ): { status: PatientStatus; statusText: string } {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hours48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // 检查是否失联（超过48小时未测量）
    if (!patient.lastMeasureTime || new Date(patient.lastMeasureTime) < hours48Ago) {
      return { status: 'offline', statusText: '超过48小时未测量' };
    }

    // 检查今日是否有严重预警（紧急）
    const todayDangerAlerts = alerts.filter(
      a => a.level === 'danger' && new Date(a.alertTime) >= todayStart
    );
    if (todayDangerAlerts.length > 0) {
      return { status: 'urgent', statusText: '需紧急关注' };
    }

    // 检查近7日是否有预警（关注）
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekAlerts = alerts.filter(a => new Date(a.alertTime) >= weekStart);
    if (weekAlerts.length > 0) {
      return { status: 'attention', statusText: '近期有波动' };
    }

    // 平稳状态
    const stableDays = patient.stableDays || 0;
    return {
      status: 'stable',
      statusText: stableDays > 0 ? `持续达标 ${stableDays} 天` : '指标正常',
    };
  }

  async getPatients(doctorId: number, keyword?: string): Promise<any[]> {
    const query = this.relRepo
      .createQueryBuilder('rel')
      .leftJoinAndSelect('rel.patient', 'patient')
      .where('rel.doctorId = :doctorId', { doctorId })
      .orderBy('patient.createdAt', 'DESC');

    if (keyword) {
      query.andWhere('(patient.name LIKE :keyword OR patient.phone LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    const relations = await query.getMany();
    const patients = relations.map(rel => rel.patient);

    // Enrich patients with alert info and status
    const enriched = await Promise.all(patients.map(async (p) => {
      const alerts = await this.alertRepo
        .createQueryBuilder('alert')
        .where('alert.patientId = :patientId', { patientId: p.id })
        .orderBy('alert.alertTime', 'DESC')
        .getMany();

      const latestAlert = alerts.length > 0 ? alerts[0] : null;
      const alertTypes = [...new Set(alerts.map(a => a.alertType))];

      // 计算今日预警
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayAlerts = alerts.filter(a => new Date(a.alertTime) >= todayStart);

      // 计算7日预警分布
      const weekAlertDays: boolean[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(todayStart);
        dayStart.setDate(dayStart.getDate() - i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const hasAlert = alerts.some(a => {
          const t = new Date(a.alertTime);
          return t >= dayStart && t < dayEnd;
        });
        weekAlertDays.push(hasAlert);
      }

      // 计算患者状态
      const { status, statusText } = this.calculatePatientStatus(p, alerts);

      return {
        ...p,
        hasAlert: alerts.length > 0,
        alertCount: alerts.length,
        alertTypes,
        todayAlerts: todayAlerts.map(a => ({
          alertType: a.alertType,
          value: a.value,
          unit: a.unit,
          level: a.level,
          alertTime: a.alertTime,
        })),
        weekAlertDays,
        latestAlert: latestAlert ? {
          alertType: latestAlert.alertType,
          value: latestAlert.value,
          unit: latestAlert.unit,
          level: latestAlert.level,
          alertTime: latestAlert.alertTime,
        } : null,
        status,
        statusText,
      };
    }));

    // Sort by status priority: urgent > attention > stable > offline
    const statusOrder: Record<PatientStatus, number> = {
      urgent: 0,
      attention: 1,
      stable: 2,
      offline: 3,
    };
    enriched.sort((a, b) => {
      const orderDiff = statusOrder[a.status as PatientStatus] - statusOrder[b.status as PatientStatus];
      if (orderDiff !== 0) return orderDiff;
      // Same status, sort by alert count
      return (b.alertCount || 0) - (a.alertCount || 0);
    });

    return enriched;
  }

  async getRiskDashboard(doctorId: number): Promise<{
    glucose: { todayCount: number; weekCount: number };
    bp: { todayCount: number; weekCount: number };
    hr: { todayCount: number; weekCount: number };
  }> {
    const rels = await this.relRepo.find({ where: { doctorId } });
    const patientIds = rels.map(r => r.patientId);

    if (patientIds.length === 0) {
      return {
        glucose: { todayCount: 0, weekCount: 0 },
        bp: { todayCount: 0, weekCount: 0 },
        hr: { todayCount: 0, weekCount: 0 },
      };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const result: any = {};
    for (const type of ['glucose', 'bp', 'hr'] as AlertType[]) {
      const todayAlerts = await this.alertRepo
        .createQueryBuilder('alert')
        .select('COUNT(DISTINCT alert.patientId)', 'count')
        .where('alert.alertType = :type', { type })
        .andWhere('alert.patientId IN (:...patientIds)', { patientIds })
        .andWhere('alert.alertTime >= :todayStart', { todayStart: todayStart.toISOString() })
        .getRawOne();

      const weekAlerts = await this.alertRepo
        .createQueryBuilder('alert')
        .select('COUNT(*)', 'count')
        .where('alert.alertType = :type', { type })
        .andWhere('alert.patientId IN (:...patientIds)', { patientIds })
        .andWhere('alert.alertTime >= :weekStart', { weekStart: weekStart.toISOString() })
        .getRawOne();

      result[type] = {
        todayCount: parseInt(todayAlerts?.count || '0', 10),
        weekCount: parseInt(weekAlerts?.count || '0', 10),
      };
    }

    return result;
  }

  async getRiskPatients(doctorId: number, alertType: AlertType): Promise<any[]> {
    const rels = await this.relRepo.find({ where: { doctorId } });
    const patientIds = rels.map(r => r.patientId);

    if (patientIds.length === 0) return [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const alerts = await this.alertRepo
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.patient', 'patient')
      .where('alert.alertType = :alertType', { alertType })
      .andWhere('alert.patientId IN (:...patientIds)', { patientIds })
      .orderBy('alert.alertTime', 'DESC')
      .getMany();

    const patientMap = new Map<number, { patient: Patient; alerts: HealthAlert[] }>();
    for (const alert of alerts) {
      if (!patientMap.has(alert.patientId)) {
        patientMap.set(alert.patientId, { patient: alert.patient, alerts: [] });
      }
      patientMap.get(alert.patientId)!.alerts.push(alert);
    }

    return Array.from(patientMap.values()).map(({ patient, alerts }) => {
      const weekAlerts = alerts.filter(a => new Date(a.alertTime) >= weekStart);
      const todayAlerts = alerts.filter(a => new Date(a.alertTime) >= todayStart);
      const latestAlert = alerts[0];

      // 计算7日预警分布
      const weekAlertDays: boolean[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(todayStart);
        dayStart.setDate(dayStart.getDate() - i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const hasAlert = alerts.some(a => {
          const t = new Date(a.alertTime);
          return t >= dayStart && t < dayEnd;
        });
        weekAlertDays.push(hasAlert);
      }

      return {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        phone: patient.phone,
        gender: patient.gender,
        totalAlertCount: alerts.length,
        weekAlertCount: weekAlerts.length,
        todayAlerts: todayAlerts.map(a => ({
          value: a.value,
          unit: a.unit,
          level: a.level,
          alertTime: a.alertTime,
        })),
        weekAlertDays,
        latestValue: latestAlert.value,
        latestUnit: latestAlert.unit,
        latestLevel: latestAlert.level,
        latestAlertTime: latestAlert.alertTime,
        description: latestAlert.description,
      };
    }).sort((a, b) => b.weekAlertCount - a.weekAlertCount);
  }

  async getBindQrCode(doctorId: number): Promise<{ qrCode: string; bindUrl: string }> {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    const bindUrl = `https://youyou.com/bind?code=${doctor?.bindCode || ''}`;
    const qrCode = await QRCode.toDataURL(bindUrl, { width: 300, margin: 2 });
    return { qrCode, bindUrl };
  }

  async getActivityQrCode(doctorId: number, activityId?: number): Promise<{ qrCode: string; activityUrl: string; activity: Activity } | null> {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });

    let activity: Activity | null = null;
    if (activityId) {
      activity = await this.activityRepo.findOne({ where: { id: activityId, isActive: true } });
    } else {
      activity = await this.activityRepo.findOne({ where: { isActive: true }, order: { createdAt: 'DESC' } });
    }

    if (!activity) {
      return null;
    }

    const activityUrl = activity.linkTemplate
      .replace('{doctorId}', String(doctorId))
      .replace('{bindCode}', doctor?.bindCode || '');

    const qrCode = await QRCode.toDataURL(activityUrl, { width: 300, margin: 2 });
    return { qrCode, activityUrl, activity };
  }

  async getActivities(): Promise<Activity[]> {
    return this.activityRepo.find({ where: { isActive: true }, order: { createdAt: 'DESC' } });
  }

  // ========== 工作台：待审核任务 ==========

  async getPendingReviews(doctorId: number) {
    const tasks = await this.reviewTaskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.patient', 'patient')
      .leftJoinAndSelect('task.alert', 'alert')
      .where('task.doctorId = :doctorId', { doctorId })
      .andWhere('task.status = :status', { status: 'pending' })
      .orderBy('task.priority', 'ASC')
      .addOrderBy('task.deadline', 'ASC')
      .getMany();

    return {
      count: tasks.length,
      list: tasks.map(t => {
        let context: any = {};
        try { context = JSON.parse(t.context || '{}'); } catch {}
        return {
          id: t.id,
          taskType: t.taskType,
          title: t.title,
          description: t.description,
          priority: t.priority,
          deadline: t.deadline,
          createdAt: t.createdAt,
          patientId: t.patientId,
          patientName: t.patient?.name,
          patientAge: t.patient?.age,
          patientGender: t.patient?.gender,
          patientPhone: t.patient?.phone,
          diseaseTags: context.diseaseTags || [],
          surgeryTags: context.surgeryTags || [],
          dischargeTime: context.dischargeTime || null,
          ...(t.taskType === 'high_risk_alert' && t.alert ? {
            alertId: t.alert.id,
            alertType: t.alert.alertType,
            alertValue: t.alert.value,
            alertUnit: t.alert.unit,
            alertLevel: t.alert.level,
            alertTime: t.alert.alertTime,
          } : {}),
        };
      }),
    };
  }

  async getCompletedReviews(doctorId: number) {
    const tasks = await this.reviewTaskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.patient', 'patient')
      .leftJoinAndSelect('task.alert', 'alert')
      .where('task.doctorId = :doctorId', { doctorId })
      .andWhere('task.status IN (:...statuses)', { statuses: ['approved', 'rejected'] })
      .orderBy('task.reviewedAt', 'DESC')
      .getMany();

    return {
      count: tasks.length,
      list: tasks.map(t => {
        let context: any = {};
        try { context = JSON.parse(t.context || '{}'); } catch {}
        return {
          id: t.id,
          taskType: t.taskType,
          title: t.title,
          description: t.description,
          priority: t.priority,
          deadline: t.deadline,
          createdAt: t.createdAt,
          status: t.status,
          reviewedAt: t.reviewedAt,
          patientName: t.patient?.name,
          patientAge: t.patient?.age,
          patientGender: t.patient?.gender,
          diseaseTags: context.diseaseTags || [],
          surgeryTags: context.surgeryTags || [],
          dischargeTime: context.dischargeTime || null,
          ...(t.taskType === 'high_risk_alert' && t.alert ? {
            alertId: t.alert.id,
            alertType: t.alert.alertType,
            alertValue: t.alert.value,
            alertUnit: t.alert.unit,
            alertLevel: t.alert.level,
            alertTime: t.alert.alertTime,
          } : {}),
        };
      }),
    };
  }

  async getReviewDetail(doctorId: number, taskId: number) {
    const task = await this.reviewTaskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.patient', 'patient')
      .leftJoinAndSelect('task.alert', 'alert')
      .where('task.id = :taskId', { taskId })
      .andWhere('task.doctorId = :doctorId', { doctorId })
      .getOne();

    if (!task) return null;

    // 查询该患者近期预警
    const recentAlerts = await this.alertRepo
      .createQueryBuilder('alert')
      .where('alert.patientId = :patientId', { patientId: task.patientId })
      .orderBy('alert.alertTime', 'DESC')
      .limit(20)
      .getMany();

    let context: any = {};
    try { context = JSON.parse(task.context || '{}'); } catch {}

    const baseResponse = {
      id: task.id,
      taskType: task.taskType,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      deadline: task.deadline,
      createdAt: task.createdAt,
      reviewedAt: task.reviewedAt,
      reviewComment: task.reviewComment,
      context,
      patient: {
        id: task.patient.id,
        name: task.patient.name,
        age: task.patient.age,
        gender: task.patient.gender,
        phone: task.patient.phone,
      },
      recentAlerts: recentAlerts.map(a => ({
        alertType: a.alertType,
        value: a.value,
        unit: a.unit,
        level: a.level,
        description: a.description,
        alertTime: a.alertTime,
      })),
    };

    // 高危预警类型：附加预警详情和 AI 建议
    if (task.taskType === 'high_risk_alert' && task.alert) {
      const aiSuggestions: Record<string, string> = {
        bp: `患者${task.patient.name}血压${task.alert.value}${task.alert.unit}，已超出安全范围。\n\n建议措施：\n1. 立即联系患者确认当前状态\n2. 建议患者静卧休息，15分钟后复测\n3. 如持续偏高，考虑调整降压药物剂量\n4. 建议近期增加血压监测频次至每日3次\n\n注意事项：如收缩压持续>180mmHg，建议就近就医。`,
        glucose: `患者${task.patient.name}血糖${task.alert.value}${task.alert.unit}，明显高于正常范围。\n\n建议措施：\n1. 确认患者近期饮食情况\n2. 建议减少碳水化合物摄入\n3. 考虑调整降糖药物或胰岛素剂量\n4. 增加血糖监测频次\n\n注意事项：如血糖持续>16.7mmol/L，需警惕酮症酸中毒。`,
        hr: `患者${task.patient.name}心率${task.alert.value}${task.alert.unit}，高于正常范围。\n\n建议措施：\n1. 联系患者了解是否有胸闷、心悸症状\n2. 建议患者停止当前活动，静坐休息\n3. 评估是否需要调整β受体阻滞剂剂量\n4. 建议做12导联心电图排除心律失常\n\n注意事项：如伴有胸痛或晕厥，建议立即就医。`,
      };

      return {
        ...baseResponse,
        alertDetail: {
          id: task.alert.id,
          alertType: task.alert.alertType,
          value: task.alert.value,
          unit: task.alert.unit,
          level: task.alert.level,
          description: task.alert.description,
          alertTime: task.alert.alertTime,
        },
        aiSuggestion: aiSuggestions[task.alert.alertType] || '暂无AI建议',
      };
    }

    // 周期报告类型：附加康复总结和下周期计划
    if (task.taskType === 'monthly_report') {
      const recoveryData = context.recoveryData || {};
      const defaultSummary = `患者${task.patient.name}本周期康复整体表现良好。用药依从性${recoveryData.medicationAdherence || '—'}，运动处方完成率${recoveryData.exerciseCompletion || '—'}，血压控制在${recoveryData.avgBP || '—'}，心率平均${recoveryData.avgHR || '—'}，血糖${recoveryData.avgGlucose || '—'}。建议继续保持当前康复节奏，关注各项指标变化。`;
      const defaultPlan = `下周期计划：\n1. 运动处方：维持当前运动量，适当增加有氧运动\n2. 用药方案：维持当前药物剂量\n3. 监测计划：继续按计划监测各项指标\n4. 饮食管理：继续低盐低脂饮食\n5. 复诊安排：按计划复诊`;

      return {
        ...baseResponse,
        recoverySummary: context.recoverySummary || defaultSummary,
        nextCyclePlan: context.nextCyclePlan || defaultPlan,
      };
    }

    return baseResponse;
  }

  async submitReview(doctorId: number, taskId: number, action: string, comment: string) {
    const task = await this.reviewTaskRepo.findOne({
      where: { id: taskId, doctorId },
    });
    if (!task) return null;

    task.status = action === 'approve' ? 'approved' : 'rejected';
    task.reviewComment = comment;
    task.reviewedAt = new Date();
    return this.reviewTaskRepo.save(task);
  }

  async submitReviewIntervention(doctorId: number, taskId: number, data: {
    suggestion: string;
    pushToPatient: boolean;
    pushToFamily: boolean;
    comment?: string;
  }) {
    const task = await this.reviewTaskRepo.findOne({
      where: { id: taskId, doctorId },
    });
    if (!task || !task.alertId) return null;

    // 保存干预记录
    await this.interventionRepo.save({
      alertId: task.alertId,
      doctorId,
      patientId: task.patientId,
      aiSuggestion: data.suggestion,
      doctorModifiedSuggestion: data.suggestion,
      pushedToPatient: data.pushToPatient,
      pushedToFamily: data.pushToFamily,
      pushedAt: new Date(),
    });

    // 标记审核任务为已通过
    task.status = 'approved';
    task.reviewComment = data.comment || '已处理并推送干预建议';
    task.reviewedAt = new Date();
    await this.reviewTaskRepo.save(task);

    return { success: true };
  }

  // ========== 工作台：紧急预警 ==========

  async getEmergencyAlerts(doctorId: number) {
    const rels = await this.relRepo.find({ where: { doctorId } });
    const patientIds = rels.map(r => r.patientId);
    if (patientIds.length === 0) return [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const alerts = await this.alertRepo
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.patient', 'patient')
      .where('alert.patientId IN (:...patientIds)', { patientIds })
      .andWhere('alert.level = :level', { level: 'danger' })
      .andWhere('alert.alertTime >= :todayStart', { todayStart: todayStart.toISOString() })
      .orderBy('alert.alertTime', 'DESC')
      .getMany();

    return alerts.map(a => ({
      id: a.id,
      alertType: a.alertType,
      value: a.value,
      unit: a.unit,
      level: a.level,
      description: a.description,
      alertTime: a.alertTime,
      patientId: a.patientId,
      patientName: a.patient?.name,
      patientAge: a.patient?.age,
      patientGender: a.patient?.gender,
      patientPhone: a.patient?.phone,
    }));
  }

  async getAlertDetail(doctorId: number, alertId: number) {
    const alert = await this.alertRepo
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.patient', 'patient')
      .where('alert.id = :alertId', { alertId })
      .getOne();

    if (!alert) return null;

    // 验证该患者属于此医生
    const rel = await this.relRepo.findOne({
      where: { doctorId, patientId: alert.patientId },
    });
    if (!rel) return null;

    // 近期体征数据
    const recentAlerts = await this.alertRepo
      .createQueryBuilder('a')
      .where('a.patientId = :patientId', { patientId: alert.patientId })
      .orderBy('a.alertTime', 'DESC')
      .limit(10)
      .getMany();

    // 模拟 AI 建议
    const aiSuggestions: Record<string, string> = {
      bp: `患者${alert.patient.name}血压${alert.value}${alert.unit}，已超出安全范围。\n\n建议措施：\n1. 立即联系患者确认当前状态\n2. 建议患者静卧休息，15分钟后复测\n3. 如持续偏高，考虑调整降压药物剂量\n4. 建议近期增加血压监测频次至每日3次\n\n注意事项：如收缩压持续>180mmHg，建议就近就医。`,
      glucose: `患者${alert.patient.name}血糖${alert.value}${alert.unit}，明显高于正常范围。\n\n建议措施：\n1. 确认患者近期饮食情况\n2. 建议减少碳水化合物摄入\n3. 考虑调整降糖药物或胰岛素剂量\n4. 增加血糖监测频次\n\n注意事项：如血糖持续>16.7mmol/L，需警惕酮症酸中毒。`,
      hr: `患者${alert.patient.name}心率${alert.value}${alert.unit}，高于正常范围。\n\n建议措施：\n1. 联系患者了解是否有胸闷、心悸症状\n2. 建议患者停止当前活动，静坐休息\n3. 评估是否需要调整β受体阻滞剂剂量\n4. 建议做12导联心电图排除心律失常\n\n注意事项：如伴有胸痛或晕厥，建议立即就医。`,
    };

    return {
      id: alert.id,
      alertType: alert.alertType,
      value: alert.value,
      unit: alert.unit,
      level: alert.level,
      description: alert.description,
      alertTime: alert.alertTime,
      patient: {
        id: alert.patient.id,
        name: alert.patient.name,
        age: alert.patient.age,
        gender: alert.patient.gender,
        phone: alert.patient.phone,
      },
      recentVitals: recentAlerts.map(a => ({
        alertType: a.alertType,
        value: a.value,
        unit: a.unit,
        level: a.level,
        alertTime: a.alertTime,
      })),
      aiSuggestion: aiSuggestions[alert.alertType] || '暂无AI建议',
    };
  }

  async submitIntervention(doctorId: number, alertId: number, data: {
    suggestion: string;
    pushToPatient: boolean;
    pushToFamily: boolean;
  }) {
    const alert = await this.alertRepo.findOne({ where: { id: alertId } });
    if (!alert) return null;

    const intervention = await this.interventionRepo.save({
      alertId,
      doctorId,
      patientId: alert.patientId,
      aiSuggestion: data.suggestion,
      doctorModifiedSuggestion: data.suggestion,
      pushedToPatient: data.pushToPatient,
      pushedToFamily: data.pushToFamily,
      pushedAt: new Date(),
    });

    return intervention;
  }

  // ========== 患者沟通 ==========

  async getConversations(doctorId: number) {
    const messages = await this.messageRepo
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.patient', 'patient')
      .where('msg.doctorId = :doctorId', { doctorId })
      .orderBy('msg.createdAt', 'DESC')
      .getMany();

    const convMap = new Map<number, {
      patientId: number;
      patientName: string;
      patientAge: number;
      patientGender: string;
      lastMessage: string;
      lastTime: Date;
      unreadCount: number;
    }>();

    for (const msg of messages) {
      if (!convMap.has(msg.patientId)) {
        convMap.set(msg.patientId, {
          patientId: msg.patientId,
          patientName: msg.patient?.name || '',
          patientAge: msg.patient?.age || 0,
          patientGender: msg.patient?.gender || '',
          lastMessage: msg.content,
          lastTime: msg.createdAt,
          unreadCount: 0,
        });
      }
      if (msg.direction === 'patient_to_doctor' && !msg.isRead) {
        convMap.get(msg.patientId)!.unreadCount++;
      }
    }

    return Array.from(convMap.values()).sort(
      (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
    );
  }

  async getMessages(doctorId: number, patientId: number) {
    // 标记该患者发来的未读消息为已读
    await this.messageRepo
      .createQueryBuilder()
      .update(DoctorMessage)
      .set({ isRead: true })
      .where('doctorId = :doctorId', { doctorId })
      .andWhere('patientId = :patientId', { patientId })
      .andWhere('direction = :direction', { direction: 'patient_to_doctor' })
      .andWhere('isRead = :isRead', { isRead: false })
      .execute();

    const messages = await this.messageRepo
      .createQueryBuilder('msg')
      .where('msg.doctorId = :doctorId', { doctorId })
      .andWhere('msg.patientId = :patientId', { patientId })
      .orderBy('msg.createdAt', 'ASC')
      .getMany();

    // 查患者信息
    const patient = await this.patientRepo.findOne({ where: { id: patientId } });

    return {
      patient: patient ? {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
      } : null,
      messages: messages.map(m => ({
        id: m.id,
        direction: m.direction,
        content: m.content,
        messageType: m.messageType,
        isRead: m.isRead,
        createdAt: m.createdAt,
      })),
    };
  }

  async sendMessage(doctorId: number, patientId: number, content: string) {
    const msg = await this.messageRepo.save({
      doctorId,
      patientId,
      messageType: 'text',
      direction: 'doctor_to_patient',
      content,
      isRead: true,
    });

    // 模拟患者自动回复（demo 用）
    const autoReplies = [
      '好的医生，我知道了',
      '谢谢张医生的建议',
      '明白了，我会注意的',
      '收到，我马上去做',
    ];
    setTimeout(async () => {
      await this.messageRepo.save({
        doctorId,
        patientId,
        messageType: 'text',
        direction: 'patient_to_doctor',
        content: autoReplies[Math.floor(Math.random() * autoReplies.length)],
        isRead: false,
      });
    }, 1500);

    return msg;
  }

  // ========== 我的页面：执业数据 ==========

  async getPracticeStats(doctorId: number) {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    const rels = await this.relRepo.find({ where: { doctorId } });
    const patientCount = rels.length;

    const guardDays = doctor?.createdAt
      ? Math.max(1, Math.floor((Date.now() - new Date(doctor.createdAt).getTime()) / 86400000))
      : 1258;

    const totalReviews = await this.reviewTaskRepo.count({ where: { doctorId } });
    const approvedReviews = await this.reviewTaskRepo.count({ where: { doctorId, status: 'approved' } });
    const alertCount = await this.interventionRepo.count({ where: { doctorId } });

    return {
      guardDays: Math.max(guardDays, 1258),
      patientCount: Math.max(patientCount, 342),
      recoveryRate: totalReviews > 0 ? Math.round((approvedReviews / totalReviews) * 100) : 85,
      alertInterventionCount: Math.max(alertCount, 1200),
    };
  }

  // ========== 我的页面：收入概览 ==========

  async getIncomeOverview(doctorId: number) {
    const incomes = await this.incomeRepo.find({ where: { doctorId } });
    const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthIncomes = incomes.filter(i => new Date(i.incomeDate) >= thisMonthStart);
    const lastMonthIncomes = incomes.filter(i => {
      const d = new Date(i.incomeDate);
      return d >= lastMonthStart && d < thisMonthStart;
    });

    const monthlyIncome = thisMonthIncomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const lastMonthTotal = lastMonthIncomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const monthlyChange = lastMonthTotal > 0
      ? Math.round(((monthlyIncome - lastMonthTotal) / lastMonthTotal) * 1000) / 10
      : 12.5;

    return {
      monthlyIncome: monthlyIncome || 12580,
      monthlyChange: monthlyChange || 12.5,
      totalIncome: totalIncome || 158600,
    };
  }

  // ========== 我的页面：收入构成 ==========

  async getIncomeBreakdown(doctorId: number, month?: string) {
    const incomes = await this.incomeRepo.find({ where: { doctorId } });
    const total = incomes.reduce((sum, i) => sum + Number(i.amount), 0) || 1;

    const categoryMap: Record<string, { label: string; amount: number }> = {
      monitoring: { label: '监测管理费', amount: 0 },
      consultation: { label: '咨询服务费', amount: 0 },
      plan_review: { label: '计划审核费', amount: 0 },
      report_review: { label: '报告审核费', amount: 0 },
      referral_bonus: { label: '推荐奖励', amount: 0 },
    };

    for (const i of incomes) {
      if (categoryMap[i.category]) {
        categoryMap[i.category].amount += Number(i.amount);
      }
    }

    return {
      month: month || new Date().toISOString().slice(0, 7),
      categories: Object.entries(categoryMap).map(([category, { label, amount }]) => ({
        category,
        label,
        amount,
        percentage: Math.round((amount / total) * 100),
      })).filter(c => c.amount > 0),
      total,
    };
  }

  // ========== 我的页面：收入明细 ==========

  async getIncomeDetails(doctorId: number, page: number, month?: string) {
    const query = this.incomeRepo
      .createQueryBuilder('income')
      .leftJoinAndSelect('income.patient', 'patient')
      .where('income.doctorId = :doctorId', { doctorId })
      .orderBy('income.incomeDate', 'DESC')
      .skip((page - 1) * 20)
      .take(20);

    const incomes = await query.getMany();

    return {
      list: incomes.map(i => ({
        id: i.id,
        date: i.incomeDate,
        category: i.category,
        categoryLabel: this.getCategoryLabel(i.category),
        description: i.description,
        patientName: i.patient?.name || '-',
        amount: Number(i.amount),
        settlementStatus: i.settlementStatus,
      })),
      hasMore: incomes.length === 20,
    };
  }

  private getCategoryLabel(category: string): string {
    const map: Record<string, string> = {
      monitoring: '监测管理费',
      consultation: '咨询服务费',
      plan_review: '计划审核费',
      report_review: '报告审核费',
      referral_bonus: '推荐奖励',
    };
    return map[category] || category;
  }

  // ========== 工作台：7天监测趋势 ==========

  async getAlertTrend(doctorId: number, patientId: number, alertType: string, limit = 15) {
    const rel = await this.relRepo.findOne({ where: { doctorId, patientId } });
    if (!rel) return [];

    const alerts = await this.alertRepo
      .createQueryBuilder('alert')
      .where('alert.patientId = :patientId', { patientId })
      .andWhere('alert.alertType = :alertType', { alertType })
      .orderBy('alert.alertTime', 'ASC')
      .take(limit)
      .getMany();

    return alerts.map(a => ({
      date: new Date(a.alertTime).toISOString(),
      value: parseFloat(a.value.split('/')[0]),
      isAbnormal: a.level === 'danger',
    }));
  }

  // ========== 留言处理 ==========

  async getLeaveMessages(doctorId: number) {
    // 获取医生关联的患者
    const rels = await this.relRepo.find({ where: { doctorId } });
    if (!rels.length) return [];

    const patientIds = rels.map(r => r.patientId);
    const patients = await this.patientRepo.findByIds(patientIds);
    const patientMap = new Map(patients.map(p => [p.id, p]));

    // 从消息中筛选留言类型
    const messages = await this.messageRepo
      .createQueryBuilder('msg')
      .where('msg.patientId IN (:...patientIds)', { patientIds })
      .andWhere('msg.direction = :dir', { dir: 'patient_to_doctor' })
      .andWhere('msg.doctorId = :doctorId', { doctorId })
      .orderBy('msg.createdAt', 'DESC')
      .take(50)
      .getMany();

    return messages.map((msg, idx) => {
      const patient = patientMap.get(msg.patientId);
      const isFamily = idx % 3 === 0; // Mock: some from family
      return {
        id: msg.id,
        patientId: msg.patientId,
        patientName: patient?.name || '未知',
        patientAge: patient?.age || 0,
        patientGender: patient?.gender || 'unknown',
        senderType: isFamily ? 'family' : 'patient',
        senderName: isFamily ? (patient?.name ? patient.name.charAt(0) + '家属' : '家属') : (patient?.name || '患者'),
        content: msg.content,
        createdAt: msg.createdAt,
        isProcessed: msg.isRead,
        aiSuggestion: `根据${patient?.name || '患者'}的留言内容分析：建议关注患者近期状态变化，可结合最新监测数据综合评估。如有异常指标，建议适当调整用药方案或安排复诊。`,
        doctorReply: msg.isRead ? '已收到您的留言，我会尽快为您处理。请注意按时服药和监测。' : null,
        doctorReplyTime: msg.isRead ? msg.createdAt : null,
        additionalReplies: [],
      };
    });
  }

  async replyLeaveMessage(doctorId: number, messageId: number, data: { reply: string; aiSuggestion?: string }) {
    const msg = await this.messageRepo.findOne({ where: { id: messageId, doctorId } });
    if (!msg) return null;

    // Mark as read/processed
    msg.isRead = true;
    await this.messageRepo.save(msg);

    // Create reply message
    const reply = this.messageRepo.create({
      doctorId,
      patientId: msg.patientId,
      direction: 'doctor_to_patient',
      content: data.reply,
      messageType: 'text',
      isRead: false,
    });
    await this.messageRepo.save(reply);

    return { success: true };
  }

  async appendLeaveMessageReply(doctorId: number, messageId: number, content: string) {
    const msg = await this.messageRepo.findOne({ where: { id: messageId, doctorId } });
    if (!msg) return null;

    const reply = this.messageRepo.create({
      doctorId,
      patientId: msg.patientId,
      direction: 'doctor_to_patient',
      content,
      messageType: 'text',
      isRead: false,
    });
    await this.messageRepo.save(reply);

    return { success: true };
  }
}
