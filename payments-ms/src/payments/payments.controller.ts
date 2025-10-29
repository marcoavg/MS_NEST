import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dto/payment-session.dto';
import express from 'express';
import { MessagePattern } from '@nestjs/microservices';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  //@Post('create-payment-session')
  @MessagePattern('create.payment.session')
  createPaymentSession(@Body() paymentSessionDto: PaymentSessionDto) {
    //return{ paymentSessionDto}
    return this.paymentsService.createPaymentSession(paymentSessionDto);
  }

  @Get('success')
  paymentSuccess() {
    return {
      ok: true,
      message: "Payment successful"
    };
  }

  @Get('cancel')
  paymentCancel() {
    return {
      ok: false,
      message: "Payment cancel"
    };
  }

  @Post('webhook')
  async stripeWebhook(
    @Req() req: express.Request,
    @Res() res: express.Response
  ) {
    return await this.paymentsService.stripeWebhook(req, res);
  }
}
