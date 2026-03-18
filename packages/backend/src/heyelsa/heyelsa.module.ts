import { Module } from '@nestjs/common';
import { HeyElsaController } from './heyelsa.controller';
import { HeyElsaService } from './heyelsa.service';

@Module({
  controllers: [HeyElsaController],
  providers: [HeyElsaService],
  exports: [HeyElsaService],
})
export class HeyElsaModule {}
