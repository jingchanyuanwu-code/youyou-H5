import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { Doctor, Patient, DoctorPatientRel, Activity, HealthAlert } from '../../entities';
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
}
