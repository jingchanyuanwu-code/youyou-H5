import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Doctor, VerificationCode } from '../../entities';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
    @InjectRepository(VerificationCode)
    private codeRepo: Repository<VerificationCode>,
    private jwtService: JwtService,
  ) {}

  async sendCode(phone: string): Promise<{ success: boolean; message: string; code?: string }> {
    // 检查手机号是否在医生白名单
    const doctor = await this.doctorRepo.findOne({ where: { phone, isWhitelisted: true } });
    if (!doctor) {
      return { success: false, message: '该手机号未授权登录' };
    }

    // 开发环境使用固定验证码 123456
    const code = '123456';
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟有效

    // 保存验证码
    await this.codeRepo.save({ phone, code, expiredAt });

    console.log(`[SMS] 向 ${phone} 发送验证码: ${code}`);

    return { success: true, message: '验证码已发送', code };
  }

  async login(phone: string, code: string): Promise<{ success: boolean; message: string; token?: string; doctor?: Doctor }> {
    // 验证验证码
    const verifyCode = await this.codeRepo.findOne({
      where: { phone, code, isUsed: false, expiredAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });

    if (!verifyCode) {
      return { success: false, message: '验证码无效或已过期' };
    }

    // 标记验证码已使用
    verifyCode.isUsed = true;
    await this.codeRepo.save(verifyCode);

    // 获取医生信息
    const doctor = await this.doctorRepo.findOne({ where: { phone } });
    if (!doctor) {
      return { success: false, message: '医生信息不存在' };
    }

    // 生成 JWT Token
    const payload = { sub: doctor.id, phone: doctor.phone };
    const token = this.jwtService.sign(payload);

    return { success: true, message: '登录成功', token, doctor };
  }
}
