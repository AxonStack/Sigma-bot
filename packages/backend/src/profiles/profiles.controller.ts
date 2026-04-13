import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ProfilesService } from './profiles.service';

@Controller()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('profiles')
  getProfiles() {
    return this.profilesService.getAllProfiles();
  }

  @Get('profiles/:address')
  getProfile(@Param('address') address: string) {
    return this.profilesService.getProfile(address);
  }

  @Put('profiles/:address')
  upsertProfile(@Param('address') address: string, @Body('name') name: string) {
    return this.profilesService.upsertProfile(address, name);
  }
}
