import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PatientAuthService } from './patient-auth.service';
import { IsString, IsNotEmpty, Matches, Length } from 'class-validator';

export class PatientSendCodeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^1[3-9]\d{9}$/)
  phone: string;
}

export class PatientLoginDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^1[3-9]\d{9}$/)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}

@Controller('patient-auth')
export class PatientAuthController {
  constructor(private readonly authService: PatientAuthService) {}

  @Post('send-code')
  async sendCode(@Body() dto: PatientSendCodeDto) {
    const result = await this.authService.sendCode(dto.phone);
    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }
    return { message: '验证码已发送', code: result.code };
  }

  @Post('login')
  async login(@Body() dto: PatientLoginDto) {
    const result = await this.authService.login(dto.phone, dto.code);
    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.UNAUTHORIZED);
    }
    return { token: result.token, account: result.account };
  }
}
