import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import {
  FulfillmentMethod,
  ProductBrand,
  ProductCondition,
  SalesChannel,
} from '../types/models';

@Controller('api')
export class ApiController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('bootstrap')
  getBootstrapState() {
    return this.inventoryService.getFullBootstrapState();
  }

  @Post('stock-in/parse-note')
  parseStockInNote(@Body() body: { rawNote: string }) {
    return this.inventoryService.previewStockInNote(body?.rawNote || '');
  }

  @Post('stock-in/commit')
  commitStockIn(
    @Body()
    body: {
      source: 'NOTE_PASTE' | 'MANUAL_DROPDOWN';
      rawNote?: string;
      handledBy?: string;
      assignedTo?: string;
      items?: {
        brand: ProductBrand;
        model: string;
        storage: string;
        color: string;
        condition?: ProductCondition;
        quantity: number;
        costPrice: number;
        sellingPrice: number;
        assignedTo?: string;
      }[];
    },
  ) {
    return this.inventoryService.commitStockIn(body);
  }

  @Post('stock-out/deduct')
  deductStock(
    @Body()
    body: {
      codeOrSku: string;
      quantity?: number;
      customSellingPrice?: number;
      deductMethod?: string;
      channel?: SalesChannel;
      fulfillment?: FulfillmentMethod;
      clientName?: string;
      location?: string;
      handledBy?: string;
    },
  ) {
    return this.inventoryService.deductStock(body);
  }

  @Delete('sales/:id')
  voidSale(@Param('id') id: string) {
    return this.inventoryService.voidSaleTransaction(id);
  }

  @Patch('inventory/:sku')
  updateInventoryPricing(
    @Param('sku') sku: string,
    @Body()
    body: {
      quantity?: number;
      costPrice?: number;
      sellingPrice?: number;
      lowStockThreshold?: number;
      assignedTo?: string;
    },
  ) {
    return this.inventoryService.updateInventoryPricing(sku, body);
  }

  @Post('audit/run')
  runAudit() {
    this.inventoryService.deduplicateAndSanitizeInventory();
    return {
      diagnostics: this.inventoryService.runSystemAudit(),
      state: this.inventoryService.getFullBootstrapState(),
    };
  }

  @Post('forecast/ai-analyze')
  analyzeForecastWithAi(@Body() body: { query?: string; scenario?: string }) {
    return this.inventoryService.runAiForecastCopilot(body || {});
  }

  @Delete('database/clear')
  clearDatabase() {
    return this.inventoryService.clearAllData();
  }
}
