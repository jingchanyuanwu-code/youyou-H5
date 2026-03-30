import { Controller, Get, Post, Query, Param, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AlertType } from '../../entities/health-alert.entity';

@Controller('doctor')
@UseGuards(JwtAuthGuard)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    const doctor = await this.doctorService.getProfile(req.user.id);
    if (!doctor) {
      throw new HttpException('医生信息不存在', HttpStatus.NOT_FOUND);
    }
    return doctor;
  }

  @Get('patients')
  async getPatients(@Request() req, @Query('keyword') keyword?: string) {
    return this.doctorService.getPatients(req.user.id, keyword);
  }

  @Get('risk-dashboard')
  async getRiskDashboard(@Request() req) {
    return this.doctorService.getRiskDashboard(req.user.id);
  }

  @Get('risk-patients')
  async getRiskPatients(@Request() req, @Query('type') alertType: AlertType) {
    if (!alertType || !['glucose', 'bp', 'hr'].includes(alertType)) {
      throw new HttpException('无效的预警类型', HttpStatus.BAD_REQUEST);
    }
    return this.doctorService.getRiskPatients(req.user.id, alertType);
  }

  @Get('bind-qr')
  async getBindQrCode(@Request() req) {
    return this.doctorService.getBindQrCode(req.user.id);
  }

  @Get('activity-qr')
  async getActivityQrCode(@Request() req, @Query('activityId') activityId?: number) {
    const result = await this.doctorService.getActivityQrCode(req.user.id, activityId);
    if (!result) {
      throw new HttpException('暂无可用活动', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  @Get('activities')
  async getActivities() {
    return this.doctorService.getActivities();
  }

  // ========== 工作台：待审核 ==========

  @Get('pending-reviews')
  async getPendingReviews(@Request() req) {
    return this.doctorService.getPendingReviews(req.user.id);
  }

  @Get('completed-reviews')
  async getCompletedReviews(@Request() req) {
    return this.doctorService.getCompletedReviews(req.user.id);
  }

  @Get('review/:id')
  async getReviewDetail(@Request() req, @Param('id') id: string) {
    const result = await this.doctorService.getReviewDetail(req.user.id, parseInt(id));
    if (!result) {
      throw new HttpException('审核任务不存在', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  @Post('review/:id')
  async submitReview(@Request() req, @Param('id') id: string, @Body() body: { action: string; comment: string }) {
    const result = await this.doctorService.submitReview(req.user.id, parseInt(id), body.action, body.comment);
    if (!result) {
      throw new HttpException('审核任务不存在', HttpStatus.NOT_FOUND);
    }
    return { success: true };
  }

  @Post('review/:id/intervene')
  async submitReviewIntervention(@Request() req, @Param('id') id: string, @Body() body: { suggestion: string; pushToPatient: boolean; pushToFamily: boolean; comment?: string }) {
    const result = await this.doctorService.submitReviewIntervention(req.user.id, parseInt(id), body);
    if (!result) {
      throw new HttpException('审核任务不存在', HttpStatus.NOT_FOUND);
    }
    return { success: true };
  }

  // ========== 工作台：紧急预警 ==========

  @Get('emergency-alerts')
  async getEmergencyAlerts(@Request() req) {
    return this.doctorService.getEmergencyAlerts(req.user.id);
  }

  @Get('alert/:id/detail')
  async getAlertDetail(@Request() req, @Param('id') id: string) {
    const result = await this.doctorService.getAlertDetail(req.user.id, parseInt(id));
    if (!result) {
      throw new HttpException('预警不存在', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  @Post('alert/:id/intervene')
  async submitIntervention(@Request() req, @Param('id') id: string, @Body() body: { suggestion: string; pushToPatient: boolean; pushToFamily: boolean }) {
    const result = await this.doctorService.submitIntervention(req.user.id, parseInt(id), body);
    if (!result) {
      throw new HttpException('预警不存在', HttpStatus.NOT_FOUND);
    }
    return { success: true };
  }

  // ========== 患者沟通 ==========

  @Get('conversations')
  async getConversations(@Request() req) {
    return this.doctorService.getConversations(req.user.id);
  }

  @Get('messages/:patientId')
  async getMessages(@Request() req, @Param('patientId') patientId: string) {
    return this.doctorService.getMessages(req.user.id, parseInt(patientId));
  }

  @Post('messages/:patientId/send')
  async sendMessage(@Request() req, @Param('patientId') patientId: string, @Body() body: { content: string }) {
    return this.doctorService.sendMessage(req.user.id, parseInt(patientId), body.content);
  }

  // ========== 留言处理 ==========

  @Get('leave-messages')
  async getLeaveMessages(@Request() req) {
    return this.doctorService.getLeaveMessages(req.user.id);
  }

  @Post('leave-messages/:id/reply')
  async replyLeaveMessage(@Request() req, @Param('id') id: string, @Body() body: { reply: string; aiSuggestion?: string }) {
    return this.doctorService.replyLeaveMessage(req.user.id, parseInt(id), body);
  }

  @Post('leave-messages/:id/append')
  async appendReply(@Request() req, @Param('id') id: string, @Body() body: { content: string }) {
    return this.doctorService.appendLeaveMessageReply(req.user.id, parseInt(id), body.content);
  }

  // ========== 我的页面 ==========

  @Get('practice-stats')
  async getPracticeStats(@Request() req) {
    return this.doctorService.getPracticeStats(req.user.id);
  }

  @Get('income-overview')
  async getIncomeOverview(@Request() req) {
    return this.doctorService.getIncomeOverview(req.user.id);
  }

  @Get('income-breakdown')
  async getIncomeBreakdown(@Request() req, @Query('month') month?: string) {
    return this.doctorService.getIncomeBreakdown(req.user.id, month);
  }

  @Get('income-details')
  async getIncomeDetails(@Request() req, @Query('page') page?: string, @Query('month') month?: string) {
    return this.doctorService.getIncomeDetails(req.user.id, parseInt(page || '1'), month);
  }

  // ========== 工作台增强 ==========

  @Get('alert-trend/:patientId')
  async getAlertTrend(@Request() req, @Param('patientId') patientId: string, @Query('type') alertType: string) {
    return this.doctorService.getAlertTrend(req.user.id, parseInt(patientId), alertType);
  }
}
