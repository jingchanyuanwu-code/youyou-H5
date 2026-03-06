import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendCodeDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  async sendCode(@Body() dto: SendCodeDto) {
    const result = await this.authService.sendCode(dto.phone);
    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }
    return { message: '验证码已发送', code: result.code }; // 开发环境返回验证码
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto.phone, dto.code);
    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.UNAUTHORIZED);
    }
    return { token: result.token, doctor: result.doctor };
  }
}
