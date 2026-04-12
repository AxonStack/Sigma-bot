import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { FaucetService } from './faucet.service';

@Controller('faucet')
export class FaucetController {
  constructor(private readonly faucetService: FaucetService) {}

  @Get('status/:address')
  async getStatus(@Param('address') address: string) {
    return this.faucetService.getStatus(address);
  }

  @Post('claim')
  async claim(@Body('address') address: string) {
    return this.faucetService.claim(address);
  }

  // ── Debug Endpoints ─────────────────────────────────────
  
  @Get('debug/balances')
  async getBalances() {
    return this.faucetService.getRelayerBalances();
  }

  @Get('debug/reset/:address')
  async resetClaim(@Param('address') address: string) {
    return this.faucetService.resetClaim(address);
  }

  @Get('debug/truncate')
  async truncateClaims() {
    return this.faucetService.truncateClaims();
  }
}
