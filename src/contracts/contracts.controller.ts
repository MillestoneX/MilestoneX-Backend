import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  /** POST /contracts — Register a new smart contract for a campaign */
  @Post()
  async create(
    @Body() dto: CreateContractDto,
    @Req() req: Request & { user: any },
  ): Promise<Record<string, unknown>> {
    const userId = req.user?.sub as string;
    return this.contractsService.createContract(dto, userId);
  }

  /** GET /contracts/:contractId — Retrieve contract details with campaign info */
  @Get(':contractId')
  async getDetails(
    @Param('contractId') contractId: string,
  ): Promise<Record<string, unknown>> {
    return this.contractsService.getContractDetails(contractId);
  }
}
