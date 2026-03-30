import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Patient, VerificationCode, PatientAccount } from '../../entities';

@Injectable()
export class PatientAuthService {
  constructor(
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
    @InjectRepository(PatientAccount)
    private accountRepo: Repository<PatientAccount>,
    @InjectRepository(VerificationCode)
    private codeRepo: Repository<VerificationCode>,
    private jwtService: JwtService,
  ) {}

  async sendCode(phone: string): Promise<{ success: boolean; message: string; code?: string }> {
    const patient = await this.patientRepo.findOne({ where: { phone } });
    if (!patient) {
      return { success: false, message: '该手机号未注册' };
    }

    const code = '123456';
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.codeRepo.save({ phone, code, expiredAt });

    console.log(`[SMS-Patient] 向 ${phone} 发送验证码: ${code}`);

    return { success: true, message: '验证码已发送', code };
  }

  async login(phone: string, code: string): Promise<{ success: boolean; message: string; token?: string; account?: PatientAccount }> {
    const verifyCode = await this.codeRepo.findOne({
      where: { phone, code, isUsed: false, expiredAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });

    if (!verifyCode) {
      return { success: false, message: '验证码无效或已过期' };
    }

    verifyCode.isUsed = true;
    await this.codeRepo.save(verifyCode);

    const patient = await this.patientRepo.findOne({ where: { phone } });
    if (!patient) {
      return { success: false, message: '患者信息不存在' };
    }

    // 自动创建 PatientAccount（首次登录）
    let account = await this.accountRepo.findOne({ where: { phone } });
    if (!account) {
      account = await this.accountRepo.save({
        patientId: patient.id,
        phone,
        nickname: patient.name,
        currentIdentity: 'patient',
      });
    }

    const payload = { sub: account.id, patientId: patient.id, phone, role: 'patient' };
    const token = this.jwtService.sign(payload);

    return { success: true, message: '登录成功', token, account };
  }
}
