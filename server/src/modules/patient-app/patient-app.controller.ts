import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { PatientAppService } from './patient-app.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('patient-app')
@UseGuards(JwtAuthGuard)
export class PatientAppController {
  constructor(private readonly service: PatientAppService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    const profile = await this.service.getProfile(req.user.id);
    if (!profile) throw new HttpException('账号不存在', HttpStatus.NOT_FOUND);
    return profile;
  }

  @Get('identity')
  async getIdentity(@Request() req) {
    return this.service.getIdentity(req.user.id);
  }

  @Post('identity')
  async switchIdentity(@Request() req, @Body('identity') identity: 'patient' | 'family') {
    if (!['patient', 'family'].includes(identity)) {
      throw new HttpException('无效的身份类型', HttpStatus.BAD_REQUEST);
    }
    return this.service.switchIdentity(req.user.id, identity);
  }

  @Get('home')
  async getHome(@Request() req) {
    const data = await this.service.getHomeData(req.user.id);
    if (!data) throw new HttpException('数据不存在', HttpStatus.NOT_FOUND);
    return data;
  }

  @Get('family-members')
  async getFamilyMembers(@Request() req) {
    return this.service.getFamilyMembers(req.user.id);
  }

  @Get('member/:patientId/detail')
  async getMemberDetail(@Param('patientId') patientId: string) {
    const detail = await this.service.getMemberDetail(parseInt(patientId, 10));
    if (!detail) throw new HttpException('成员不存在', HttpStatus.NOT_FOUND);
    return detail;
  }

  @Get('tasks')
  async getTasks(@Request() req, @Query('patientId') patientId?: string) {
    const pid = patientId ? parseInt(patientId, 10) : req.user.patientId;
    return this.service.getTasks(pid);
  }

  @Post('tasks/:id/check-in')
  async checkInTask(@Param('id') id: string, @Request() req) {
    const result = await this.service.checkInTask(parseInt(id, 10), req.user.id);
    if (!result) throw new HttpException('任务不存在', HttpStatus.NOT_FOUND);
    return result;
  }

  @Get('alerts/:patientId')
  async getAlerts(@Param('patientId') patientId: string) {
    return this.service.getPatientAlerts(parseInt(patientId, 10));
  }

  @Get('recovery-plan/:patientId')
  async getRecoveryPlan(@Param('patientId') patientId: string) {
    const plan = await this.service.getRecoveryPlan(parseInt(patientId, 10));
    if (!plan) throw new HttpException('暂无康复计划', HttpStatus.NOT_FOUND);
    return plan;
  }

  @Post('consultation/send')
  async sendConsultation(
    @Request() req,
    @Body() body: { patientId: number; message: string; type: 'ai' | 'doctor' },
  ) {
    if (!body.message?.trim()) {
      throw new HttpException('消息不能为空', HttpStatus.BAD_REQUEST);
    }
    return this.service.sendConsultation(req.user.id, body.patientId, body.message, body.type || 'ai');
  }

  @Get('consultation/history')
  async getConsultationHistory(@Request() req) {
    return this.service.getConsultationHistory(req.user.id);
  }

  @Get('life-asset')
  async getLifeAsset(@Request() req) {
    return this.service.getLifeAsset(req.user.id);
  }

  @Get('notifications')
  async getNotifications(@Request() req) {
    return this.service.getNotifications(req.user.id);
  }

  @Get('alert-history')
  async getAlertHistory(@Request() req) {
    return this.service.getAllAlertHistory(req.user.id);
  }

  @Get('health-rank')
  async getHealthRank(@Request() req) {
    const data = await this.service.getHealthRank(req.user.id);
    if (!data) throw new HttpException('数据不存在', HttpStatus.NOT_FOUND);
    return data;
  }

  @Get('vital-history/:type')
  async getVitalHistory(@Request() req, @Param('type') type: string) {
    const validTypes = ['heartRate', 'bloodPressure', 'bloodSugar', 'bloodOxygen', 'weight'];
    if (!validTypes.includes(type)) {
      throw new HttpException('无效的指标类型', HttpStatus.BAD_REQUEST);
    }
    return this.service.getVitalHistory(req.user.patientId, type);
  }

  @Get('recovery-plan-detail')
  async getRecoveryPlanDetail(@Request() req) {
    const data = await this.service.getRecoveryPlanDetail(req.user.patientId);
    if (!data) throw new HttpException('暂无康复计划', HttpStatus.NOT_FOUND);
    return data;
  }

  @Get('recovery-calendar')
  async getRecoveryCalendar(@Request() req, @Query('month') month: string) {
    if (!month || !/^\d{4}-\d{1,2}$/.test(month)) {
      throw new HttpException('无效的月份参数', HttpStatus.BAD_REQUEST);
    }
    return this.service.getRecoveryCalendar(req.user.patientId, month);
  }

  @Get('day-detail')
  async getDayDetail(@Request() req, @Query('date') date: string) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new HttpException('无效的日期参数', HttpStatus.BAD_REQUEST);
    }
    return this.service.getDayDetail(req.user.patientId, date);
  }

  @Get('recovery-report')
  async getRecoveryReport(
    @Request() req,
    @Query('type') type: 'daily' | 'weekly' | 'monthly',
    @Query('date') date: string,
  ) {
    if (!['daily', 'weekly', 'monthly'].includes(type)) {
      throw new HttpException('无效的报告类型', HttpStatus.BAD_REQUEST);
    }
    return this.service.getRecoveryReport(req.user.patientId, type, date || new Date().toISOString().split('T')[0]);
  }

  @Post('plan-review/trigger')
  async triggerPlanReview(@Request() req) {
    return this.service.triggerPlanReview(req.user.patientId);
  }

  @Post('plan-review/approve')
  async approvePlanReview(@Request() req) {
    return this.service.approvePlanReview(req.user.patientId);
  }

  @Post('plan-review/accept')
  async acceptPlanChanges(@Request() req) {
    return this.service.acceptPlanChanges(req.user.patientId);
  }
}
