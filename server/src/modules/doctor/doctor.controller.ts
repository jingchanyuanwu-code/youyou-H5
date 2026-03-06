import { Controller, Get, Query, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
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
}
