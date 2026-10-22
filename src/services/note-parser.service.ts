import { Injectable } from '@nestjs/common';
import {
  InventoryItem,
  ParsedNoteItem,
  ProductBrand,
  ProductCondition,
} from '../types/models';

interface ModelCatalogDefault {
  brand: ProductBrand;
  canonicalModel: string;
  code: string;
  patterns: RegExp[];
  baseCost128: number;
  baseSell128: number;
  defaultStorage: string;
}

@Injectable()
export class NoteParserService {
  private readonly catalogDefaults: ModelCatalogDefault[] = [
    // iPhone 17 series
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 17 Pro Max',
      code: 'IP17PM',
      patterns: [/iphone\s*17\s*pro\s*max/i, /\b(?:ip)?17\s*pm\b/i, /\b17\s*pro\s*max\b/i],
      baseCost128: 68000,
      baseSell128: 74500,
      defaultStorage: '256GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 17 Pro',
      code: 'IP17P',
      patterns: [/iphone\s*17\s*pro\b/i, /\b(?:ip)?17\s*pro\b/i],
      baseCost128: 59000,
      baseSell128: 65000,
      defaultStorage: '128GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 17',
      code: 'IP17',
      patterns: [/iphone\s*17\b/i, /\bip\s*17\b/i, /^17\s+(?:64|128|256|512)/i],
      baseCost128: 46000,
      baseSell128: 51500,
      defaultStorage: '128GB',
    },
    // iPhone 16 series
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 16 Pro Max',
      code: 'IP16PM',
      patterns: [/iphone\s*16\s*pro\s*max/i, /\b(?:ip)?16\s*pm\b/i, /\b16\s*pro\s*max\b/i],
      baseCost128: 58000,
      baseSell128: 63500,
      defaultStorage: '256GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 16 Pro',
      code: 'IP16P',
      patterns: [/iphone\s*16\s*pro\b/i, /\b(?:ip)?16\s*pro\b/i],
      baseCost128: 50000,
      baseSell128: 55000,
      defaultStorage: '128GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 16 Plus',
      code: 'IP16PL',
      patterns: [/iphone\s*16\s*plus/i, /\b(?:ip)?16\s*plus\b/i],
      baseCost128: 43000,
      baseSell128: 47500,
      defaultStorage: '128GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 16',
      code: 'IP16',
      patterns: [/iphone\s*16\b/i, /\bip\s*16\b/i, /^16\s+(?:64|128|256|512)/i],
      baseCost128: 38500,
      baseSell128: 43000,
      defaultStorage: '128GB',
    },
    // iPhone 15 series
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 15 Pro Max',
      code: 'IP15PM',
      patterns: [/iphone\s*15\s*pro\s*max/i, /\b(?:ip)?15\s*pm\b/i, /\b15\s*pro\s*max\b/i],
      baseCost128: 48500,
      baseSell128: 53500,
      defaultStorage: '256GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 15 Pro',
      code: 'IP15P',
      patterns: [/iphone\s*15\s*pro\b/i, /\b(?:ip)?15\s*pro\b/i],
      baseCost128: 41500,
      baseSell128: 46000,
      defaultStorage: '128GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 15 Plus',
      code: 'IP15PL',
      patterns: [/iphone\s*15\s*plus/i, /\b(?:ip)?15\s*plus\b/i],
      baseCost128: 34500,
      baseSell128: 38500,
      defaultStorage: '128GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 15',
      code: 'IP15',
      patterns: [/iphone\s*15\b/i, /\bip\s*15\b/i, /^15\s+(?:64|128|256|512)/i],
      baseCost128: 30500,
      baseSell128: 34500,
      defaultStorage: '128GB',
    },
    // iPhone 14 series
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 14 Pro Max',
      code: 'IP14PM',
      patterns: [/iphone\s*14\s*pro\s*max/i, /\b(?:ip)?14\s*pm\b/i, /\b14\s*pro\s*max\b/i],
      baseCost128: 37500,
      baseSell128: 42000,
      defaultStorage: '128GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 14 Pro',
      code: 'IP14P',
      patterns: [/iphone\s*14\s*pro\b/i, /\b(?:ip)?14\s*pro\b/i],
      baseCost128: 32500,
      baseSell128: 36500,
      defaultStorage: '128GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 14 Plus',
      code: 'IP14PL',
      patterns: [/iphone\s*14\s*plus/i, /\b(?:ip)?14\s*plus\b/i],
      baseCost128: 26500,
      baseSell128: 30000,
      defaultStorage: '128GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 14',
      code: 'IP14',
      patterns: [/iphone\s*14\b/i, /\bip\s*14\b/i, /^14\s+(?:64|128|256|512)/i],
      baseCost128: 23500,
      baseSell128: 27000,
      defaultStorage: '128GB',
    },
    // iPhone 13 series
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 13 Pro Max',
      code: 'IP13PM',
      patterns: [/iphone\s*13\s*pro\s*max/i, /\b(?:ip)?13\s*pm\b/i, /\b13\s*pro\s*max\b/i],
      baseCost128: 29500,
      baseSell128: 33500,
      defaultStorage: '128GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 13 Pro',
      code: 'IP13P',
      patterns: [/iphone\s*13\s*pro\b/i, /\b(?:ip)?13\s*pro\b/i],
      baseCost128: 25500,
      baseSell128: 29000,
      defaultStorage: '128GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 13 Mini',
      code: 'IP13M',
      patterns: [/iphone\s*13\s*mini/i, /\b(?:ip)?13\s*mini\b/i, /\b13mini\b/i],
      baseCost128: 16500,
      baseSell128: 19500,
      defaultStorage: '128GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 13',
      code: 'IP13',
      patterns: [/iphone\s*13\b/i, /\bip\s*13\b/i, /^13\s+(?:64|128|256|512)/i],
      baseCost128: 18200,
      baseSell128: 21500,
      defaultStorage: '128GB',
    },
    // iPhone 12 series (Supports "12MINI 64", "12MINI 128", "12MINI 256" from Mr. Ventura's notes!)
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 12 Pro Max',
      code: 'IP12PM',
      patterns: [/iphone\s*12\s*pro\s*max/i, /\b(?:ip)?12\s*pm\b/i, /\b12\s*pro\s*max\b/i],
      baseCost128: 22500,
      baseSell128: 26000,
      defaultStorage: '128GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 12 Pro',
      code: 'IP12P',
      patterns: [/iphone\s*12\s*pro\b/i, /\b(?:ip)?12\s*pro\b/i],
      baseCost128: 19000,
      baseSell128: 22500,
      defaultStorage: '128GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 12 Mini',
      code: 'IP12M',
      patterns: [/iphone\s*12\s*mini/i, /\b(?:ip)?12\s*mini\b/i, /\b12mini\b/i],
      baseCost128: 8500,
      baseSell128: 11500,
      defaultStorage: '128GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 12',
      code: 'IP12',
      patterns: [/iphone\s*12\b/i, /\bip\s*12\b/i, /^12\s+(?:64|128|256|512)/i],
      baseCost128: 15000,
      baseSell128: 18000,
      defaultStorage: '128GB',
    },
    // iPhone 11 series
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 11 Pro Max',
      code: 'IP11PM',
      patterns: [/iphone\s*11\s*pro\s*max/i, /\b(?:ip)?11\s*pm\b/i],
      baseCost128: 16500,
      baseSell128: 19500,
      defaultStorage: '64GB',
    },
    {
      brand: 'Apple iPhone',
      canonicalModel: 'iPhone 11',
      code: 'IP11',
      patterns: [/iphone\s*11\b/i, /\bip\s*11\b/i, /^11\s+(?:64|128|256)/i],
      baseCost128: 12000,
      baseSell128: 14800,
      defaultStorage: '128GB',
    },
    // Apple iPads
    {
      brand: 'Apple iPad',
      canonicalModel: 'iPad Air 5th Gen',
      code: 'IPADA5',
      patterns: [/ipad\s*air\s*5/i, /ipad\s*air/i],
      baseCost128: 24000,
      baseSell128: 27800,
      defaultStorage: '64GB',
    },
    {
      brand: 'Apple iPad',
      canonicalModel: 'iPad 10th Gen',
      code: 'IPAD10',
      patterns: [/ipad\s*10(th)?(\s*gen)?/i],
      baseCost128: 18500,
      baseSell128: 21800,
      defaultStorage: '64GB',
    },
    {
      brand: 'Apple iPad',
      canonicalModel: 'iPad 9th Gen',
      code: 'IPAD9',
      patterns: [/ipad\s*9(th)?(\s*gen)?/i, /\bipad\b/i],
      baseCost128: 13500,
      baseSell128: 16200,
      defaultStorage: '64GB',
    },
    // Apple AirPods
    {
      brand: 'Apple AirPods',
      canonicalModel: 'AirPods Pro (2nd Gen)',
      code: 'APPRO2',
      patterns: [/airpods?\s*pro\s*2/i, /airpods?\s*pro/i],
      baseCost128: 9800,
      baseSell128: 11900,
      defaultStorage: 'N/A',
    },
    {
      brand: 'Apple AirPods',
      canonicalModel: 'AirPods (3rd Gen)',
      code: 'AP3',
      patterns: [/airpods?\s*3/i, /airpods/i],
      baseCost128: 6800,
      baseSell128: 8500,
      defaultStorage: 'N/A',
    },
    // Samsung
    {
      brand: 'Samsung',
      canonicalModel: 'Samsung Galaxy S24 Ultra',
      code: 'S24U',
      patterns: [/s24\s*ultra/i, /galaxy\s*s24\s*ultra/i],
      baseCost128: 45000,
      baseSell128: 50500,
      defaultStorage: '256GB',
    },
    {
      brand: 'Samsung',
      canonicalModel: 'Samsung Galaxy S23 Ultra',
      code: 'S23U',
      patterns: [/s23\s*ultra/i, /galaxy\s*s23\s*ultra/i],
      baseCost128: 32000,
      baseSell128: 36500,
      defaultStorage: '256GB',
    },
    {
      brand: 'Samsung',
      canonicalModel: 'Samsung Galaxy A55 5G',
      code: 'SGA55',
      patterns: [/galaxy\s*a55/i, /\ba55\s*5g\b/i, /\bsamsung\s*a55\b/i],
      baseCost128: 14500,
      baseSell128: 17200,
      defaultStorage: '128GB',
    },
    {
      brand: 'Samsung',
      canonicalModel: 'Samsung Galaxy Tab A9+',
      code: 'TABA9P',
      patterns: [/tab\s*a9\+?/i, /samsung\s*tab/i],
      baseCost128: 9200,
      baseSell128: 11500,
      defaultStorage: '128GB',
    },
  ];

  private readonly colorMap: { canonical: string; code: string; regex: RegExp }[] = [
    { canonical: 'Natural Titanium', code: 'NAT', regex: /natural\s*titanium|\bnatural\b/i },
    { canonical: 'Black Titanium', code: 'BLKT', regex: /black\s*titanium/i },
    { canonical: 'White Titanium', code: 'WHTT', regex: /white\s*titanium/i },
    { canonical: 'Desert Titanium', code: 'DST', regex: /desert\s*titanium|\bdesert\b/i },
    { canonical: 'Blue Titanium', code: 'BLUT', regex: /blue\s*titanium/i },
    { canonical: 'Deep Purple', code: 'DPRP', regex: /deep\s*purple/i },
    { canonical: 'Space Black', code: 'SBLK', regex: /space\s*black/i },
    { canonical: 'Space Gray', code: 'SGRY', regex: /space\s*gr[ae]y/i },
    { canonical: 'Sierra Blue', code: 'SBLU', regex: /sierra\s*blue/i },
    { canonical: 'Pacific Blue', code: 'PBLU', regex: /pacific\s*blue/i },
    { canonical: 'Alpine Green', code: 'AGRN', regex: /alpine\s*green/i },
    { canonical: 'Phantom Black', code: 'PBLK', regex: /phantom\s*black/i },
    { canonical: 'Midnight', code: 'MID', regex: /\bmidnight\b/i },
    { canonical: 'Starlight', code: 'STR', regex: /\bstarlight\b/i },
    { canonical: 'Graphite', code: 'GRP', regex: /\bgraphite\b/i },
    { canonical: 'Pink', code: 'PNK', regex: /\bpink\b|\brose\s*gold\b/i },
    { canonical: 'Purple', code: 'PRP', regex: /\bpurple\b|\blavender\b|\bviolet\b/i },
    { canonical: 'Blue', code: 'BLU', regex: /\bblue\b/i },
    { canonical: 'Green', code: 'GRN', regex: /\bgreen\b|\bmint\b/i },
    { canonical: 'Red', code: 'RED', regex: /\bred\b|\bproduct\s*red\b/i },
    { canonical: 'Yellow', code: 'YLW', regex: /\byellow\b/i },
    { canonical: 'Gold', code: 'GLD', regex: /\bgold\b/i },
    { canonical: 'Silver', code: 'SLV', regex: /\bsilver\b/i },
    { canonical: 'White', code: 'WHT', regex: /\bwhite\b/i },
    { canonical: 'Black', code: 'BLK', regex: /\bblack\b|\bblk\b/i },
  ];

  public generateDeterministicSku(
    brand: ProductBrand,
    model: string,
    storage: string,
    color: string,
    condition?: ProductCondition,
  ): string {
    let modelCode = '';
    for (const def of this.catalogDefaults) {
      if (
        def.canonicalModel.toLowerCase() === model.trim().toLowerCase() ||
        def.patterns.some((p) => p.test(model))
      ) {
        modelCode = def.code;
        break;
      }
    }
    if (!modelCode) {
      modelCode = model
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 6) || 'GADGET';
    }

    const normStorage = (storage || 'NA')
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace('GB', '')
      .replace('N/A', 'STD')
      .replace(/[^A-Z0-9]/g, '');

    let colorCode = 'STD';
    if (/^issue:/i.test(color || '')) {
      const cleanedIssue = (color || '')
        .replace(/^issue:\s*/i, '')
        .replace(/\bproblem\b/gi, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
      colorCode = 'ISS-' + (cleanedIssue.slice(0, 6) || 'DEF');
    } else if (/^all\s*colors/i.test(color || '')) {
      colorCode = 'MIX';
    } else {
      for (const c of this.colorMap) {
        if (
          c.canonical.toLowerCase() === (color || '').trim().toLowerCase() ||
          c.regex.test(color || '')
        ) {
          colorCode = c.code;
          break;
        }
      }
      if (colorCode === 'STD' && color) {
        colorCode =
          color
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase()
            .slice(0, 5) || 'STD';
      }
    }

    const condSuffix =
      condition === 'Brand New' ? '-BN' : condition === 'Factory Unlocked' ? '-FU' : '';

    return `LPG-${modelCode}-${normStorage}-${colorCode}${condSuffix}`;
  }

  /**
   * Parses both Mr. Ventura's real-world shorthand notes:
   *   12MINI 64 (4) - 7,000 // 28,000
   *   12MINI 64 (4)
   *    - FOCUS / SHAKY (2) - 6,000 // 12,000
   *    - LCD SPOT (1) - 5,500
   *   13 256 Sim Locked (1) (Auto Restart) - 10K
   * AND standard descriptive notes:
   *   iPhone 12 Mini 128GB Black x10 Cost 13500 Price 16500
   */
  public parseStockInNote(rawNote: string, existingInventory: InventoryItem[]): ParsedNoteItem[] {
    if (!rawNote || typeof rawNote !== 'string') {
      return [];
    }

    const rawLines = rawNote.split(/\r?\n/);
    const parsedItems: ParsedNoteItem[] = [];

    let parentContext: {
      brand: ProductBrand;
      model: string;
      storage: string;
      matchedCatalog: ModelCatalogDefault | null;
    } | null = null;

    for (let i = 0; i < rawLines.length; i++) {
      const rawLine = rawLines[i].trim();
      if (!rawLine) continue;

      // Skip separator lines and summary total lines (e.g., "TOTAL UNITS: 104PCS", "OVERALL TOTAL: 1,026,300", "_____")
      if (
        /^[_\-=\*]{3,}$/.test(rawLine) ||
        /^(?:total\s*units|overall\s*total|sub\s*total|grand\s*total|with\s*issues?|defects?|new\s*arrival|stock\s*in|weekly\s*stock)/i.test(
          rawLine,
        )
      ) {
        continue;
      }

      const startsWithBullet = /^[\-\•\*]\s+/.test(rawLine);
      const cleaned = rawLine.replace(/^[\-\•\*]+\s*/, '').trim();
      if (!cleaned) continue;

      // Check if this line has its own recognizable model
      const matchedCatalog = this.matchModelCatalog(cleaned);

      // Check if the next non-empty line is a bulleted sub-item without a model
      const nextNonEmpty = this.peekNextNonEmptyLine(rawLines, i + 1);
      const nextIsSubBulletWithoutModel =
        nextNonEmpty &&
        /^[\-\•\*]\s+/.test(nextNonEmpty) &&
        !this.matchModelCatalog(nextNonEmpty.replace(/^[\-\•\*]+\s*/, ''));

      // Check if current line has a price (e.g. "- 7,000", "// 28,000", "8K", "Cost 13500")
      const hasPriceOnLine =
        /\/\/\s*[\d,]+/.test(cleaned) ||
        /\-\s*₱?\s*[\d,]{4,7}\b/.test(cleaned) ||
        /\b\d+(?:\.\d+)?\s*[kK]\b/.test(cleaned) ||
        /(?:cost|price|srp)\s*[:\-=]?\s*[\d,]{4,7}/i.test(cleaned);

      if (matchedCatalog && !hasPriceOnLine && nextIsSubBulletWithoutModel) {
        // This line is a Parent Header for indented issue sub-lines! E.g. "12MINI 64 (4)"
        const storage = this.extractStorage(cleaned, matchedCatalog);
        parentContext = {
          brand: matchedCatalog.brand,
          model: matchedCatalog.canonicalModel,
          storage,
          matchedCatalog,
        };
        continue;
      }

      let item: ParsedNoteItem | null = null;
      if (matchedCatalog) {
        // Reset parentContext if this is a top-level model line
        if (!startsWithBullet) {
          parentContext = null;
        }
        item = this.parseModelLine(cleaned, rawLine, matchedCatalog, existingInventory);
      } else if (startsWithBullet && parentContext) {
        // Indented issue sub-line inheriting model & storage from parentContext!
        // E.g. "- FOCUS / SHAKY (2) - 6,000 // 12,000" or "- SPOT / NO LOWER SPEAKER (1) - 8K"
        item = this.parseSubIssueLine(cleaned, rawLine, parentContext, existingInventory);
      } else {
        item = this.parseModelLine(cleaned, rawLine, null, existingInventory);
      }

      if (item) {
        const duplicateInSameNote = parsedItems.find((p) => p.sku === item.sku);
        if (duplicateInSameNote) {
          duplicateInSameNote.quantity += item.quantity;
          if (!item.priceAutoFilled) {
            duplicateInSameNote.costPrice = item.costPrice;
            duplicateInSameNote.sellingPrice = item.sellingPrice;
            duplicateInSameNote.unitProfit = item.sellingPrice - item.costPrice;
          }
        } else {
          parsedItems.push(item);
        }
      }
    }

    return parsedItems;
  }

  private peekNextNonEmptyLine(lines: string[], startIdx: number): string | null {
    for (let j = startIdx; j < lines.length; j++) {
      const t = lines[j].trim();
      if (t.length > 0) return t;
    }
    return null;
  }

  private matchModelCatalog(text: string): ModelCatalogDefault | null {
    for (const def of this.catalogDefaults) {
      if (def.patterns.some((p) => p.test(text))) {
        return def;
      }
    }
    return null;
  }

  private extractStorage(text: string, matchedCatalog: ModelCatalogDefault | null): string {
    // Match explicit "64GB", "128GB", "256GB", "512GB", "1TB" OR shorthand after model like "12MINI 64", "13 256"
    const explicit = text.match(/\b(64|128|256|512)\s*(?:gb|g)?\b|\b(1|2)\s*tb\b/i);
    if (explicit) {
      if (explicit[1]) return `${explicit[1]}GB`;
      if (explicit[2]) return `${explicit[2]}TB`;
    }
    if (matchedCatalog?.brand === 'Apple AirPods') return 'N/A';
    return matchedCatalog ? matchedCatalog.defaultStorage : '128GB';
  }

  private parseSubIssueLine(
    cleanedLine: string,
    originalLine: string,
    parent: {
      brand: ProductBrand;
      model: string;
      storage: string;
      matchedCatalog: ModelCatalogDefault | null;
    },
    existingInventory: InventoryItem[],
  ): ParsedNoteItem | null {
    // Extract quantity in parentheses e.g. "(2)" or "(1)"
    let quantity = 1;
    const parenQtyMatches = [...cleanedLine.matchAll(/\((\d{1,3})\)/g)];
    if (parenQtyMatches.length > 0) {
      quantity = Math.max(1, parseInt(parenQtyMatches[0][1], 10));
    }

    // Extract issue label before the quantity/price (e.g. "FOCUS / SHAKY", "LCD SPOT", "BACKGLASS")
    let issueLabel = cleanedLine
      .split(/\(\d+\)/)[0]
      .replace(/[\-\/]+$/, '')
      .trim();

    // Check if there is an extra parenthetical note like "(REPLACED)" or "(SLIGHT)"
    const extraNotes = [...cleanedLine.matchAll(/\(([a-zA-Z\s\/]+)\)/g)]
      .map((m) => m[1].trim())
      .filter((s) => s.length > 1);
    if (extraNotes.length > 0) {
      issueLabel = `${issueLabel} (${extraNotes.join(', ')})`.trim();
    }
    if (!issueLabel) issueLabel = 'With Issue';

    const { costPrice, sellingPrice, priceAutoFilled } = this.extractVenturaPrices(
      cleanedLine,
      quantity,
      parent.matchedCatalog,
      parent.storage,
      existingInventory,
    );

    const colorOrVariant = `Issue: ${this.toTitleCase(issueLabel)}`;
    const condition: ProductCondition = 'Pre-Owned (Smooth)';
    const sku = this.generateDeterministicSku(
      parent.brand,
      parent.model,
      parent.storage,
      colorOrVariant,
      condition,
    );

    const existingItem = existingInventory.find(
      (inv) => inv.sku.toUpperCase() === sku.toUpperCase(),
    );

    return {
      rawLine: originalLine,
      brand: parent.brand,
      model: parent.model,
      storage: parent.storage,
      color: colorOrVariant,
      condition,
      quantity,
      costPrice,
      sellingPrice,
      unitProfit: sellingPrice - costPrice,
      sku,
      existingMatchId: existingItem?.id,
      existingQty: existingItem?.quantity,
      matchStatus: existingItem ? 'MERGE_EXISTING' : 'NEW_VARIANT',
      priceAutoFilled,
    };
  }

  private parseModelLine(
    cleanedLine: string,
    originalLine: string,
    matchedCatalog: ModelCatalogDefault | null,
    existingInventory: InventoryItem[],
  ): ParsedNoteItem | null {
    let brand: ProductBrand = matchedCatalog ? matchedCatalog.brand : 'Apple iPhone';
    let model = matchedCatalog ? matchedCatalog.canonicalModel : '';

    if (!matchedCatalog) {
      if (/ipad/i.test(cleanedLine)) {
        brand = 'Apple iPad';
        model = 'iPad 9th Gen';
      } else if (/airpod/i.test(cleanedLine)) {
        brand = 'Apple AirPods';
        model = 'AirPods Pro (2nd Gen)';
      } else if (/samsung|galaxy/i.test(cleanedLine)) {
        brand = 'Samsung';
        model = 'Samsung Galaxy S23 Ultra';
      } else {
        return null;
      }
    }

    const storage = this.extractStorage(cleanedLine, matchedCatalog);

    // Check for color OR issue note (like "Sim Locked (Auto Restart)" in "13 256 Sim Locked (1) (Auto Restart) - 10K")
    let color = brand === 'Apple AirPods' ? 'White' : 'All Colors / Mix';
    for (const c of this.colorMap) {
      if (c.regex.test(cleanedLine)) {
        color = c.canonical;
        break;
      }
    }

    if (color === 'All Colors / Mix' && /sim\s*locked|locked|issue|auto\s*restart|spot|lcd/i.test(cleanedLine)) {
      const extraParen = [...cleanedLine.matchAll(/\(([a-zA-Z\s\/]+)\)/g)]
        .map((m) => m[1].trim())
        .join(', ');
      if (/sim\s*locked/i.test(cleanedLine)) {
        color = extraParen ? `Sim Locked (${extraParen})` : 'Sim Locked';
      }
    }

    // Condition
    let condition: ProductCondition = 'Pre-Owned (Smooth)';
    if (/brand\s*new|\bsealed\b|\bbnew\b/i.test(cleanedLine)) {
      condition = 'Brand New';
    } else if (/factory\s*unlocked|\bfu\b/i.test(cleanedLine)) {
      condition = 'Factory Unlocked';
    }

    // Quantity: First check Mr. Ventura's parentheses format "(4)", "(8)", "(9)"
    let quantity = 1;
    const parenQty = cleanedLine.match(/\((\d{1,3})\)/);
    if (parenQty) {
      quantity = Math.max(1, parseInt(parenQty[1], 10));
    } else {
      let scratch = cleanedLine
        .replace(/iphone\s*\d+/gi, ' ')
        .replace(/\b\d+\s*mini\b/gi, ' ')
        .replace(/\bip\s*\d+/gi, ' ')
        .replace(/^1[1-7]\b/gi, ' ')
        .replace(/ipad\s*\d+(?:th)?/gi, ' ')
        .replace(/airpods?\s*(?:pro\s*)?\d*/gi, ' ')
        .replace(/s2[0-9]\b|a55\s*5g|a9\+/gi, ' ')
        .replace(/\b(64|128|256|512)\s*(?:gb|g)?\b/gi, ' ')
        .replace(/\b[12]\s*tb\b/gi, ' ');

      const explicitQtyMatch =
        scratch.match(/(?:qty|quantity|pcs|pc|units?|stocks?)\s*[:\-=]?\s*(\d{1,3})\b/i) ||
        scratch.match(/\b(\d{1,3})\s*(?:pcs?|units?|deals?|boxes|stocks?)\b/i) ||
        scratch.match(/(?:^|\s)[xX](\d{1,3})\b/) ||
        scratch.match(/\b(\d{1,3})[xX](?:\s|$)/);

      if (explicitQtyMatch) {
        quantity = Math.max(1, parseInt(explicitQtyMatch[1], 10));
      }
    }

    const { costPrice, sellingPrice, priceAutoFilled } = this.extractVenturaPrices(
      cleanedLine,
      quantity,
      matchedCatalog,
      storage,
      existingInventory,
      brand,
      model,
      color,
      condition,
    );

    const sku = this.generateDeterministicSku(brand, model, storage, color, condition);
    const existingItem = existingInventory.find(
      (inv) => inv.sku.toUpperCase() === sku.toUpperCase(),
    );

    return {
      rawLine: originalLine,
      brand,
      model,
      storage,
      color,
      condition,
      quantity,
      costPrice,
      sellingPrice,
      unitProfit: sellingPrice - costPrice,
      sku,
      existingMatchId: existingItem?.id,
      existingQty: existingItem?.quantity,
      matchStatus: existingItem ? 'MERGE_EXISTING' : 'NEW_VARIANT',
      priceAutoFilled,
    };
  }

  /**
   * Handles both:
   * 1) Mr. Ventura's format: "- 7,000 // 28,000" (where 7,000 is unit cost and 28,000 is line total = qty * unitCost)
   * 2) Shorthand "K" prices: "- 8K", "- 10K", "- 7.5K"
   * 3) Explicit "Cost 13500 Price 16500"
   */
  private extractVenturaPrices(
    text: string,
    quantity: number,
    matchedCatalog: ModelCatalogDefault | null,
    storage: string,
    existingInventory: InventoryItem[],
    brand?: ProductBrand,
    model?: string,
    color?: string,
    condition?: ProductCondition,
  ): { costPrice: number; sellingPrice: number; priceAutoFilled: boolean } {
    let costPrice = 0;
    let sellingPrice = 0;
    let priceAutoFilled = false;

    // 1. Check explicit "Cost X" and "Price/SRP Y"
    const explicitCostMatch = text.match(/(?:cost|capital|buy|kuha)\s*[:\-=@]?\s*(?:php|₱|p)?\s*([\d,]{4,7})/i);
    const explicitSellMatch = text.match(/(?:price|sell|srp|benta|retail)\s*[:\-=@]?\s*(?:php|₱|p)?\s*([\d,]{4,7})/i);
    if (explicitCostMatch) costPrice = parseInt(explicitCostMatch[1].replace(/,/g, ''), 10);
    if (explicitSellMatch) sellingPrice = parseInt(explicitSellMatch[1].replace(/,/g, ''), 10);

    // 2. Check Mr. Ventura's "- 7,000 // 28,000" format (Unit Cost // Line Total Cost)
    if (!costPrice) {
      const slashFormat = text.match(/([\d,]{4,7}|\d+(?:\.\d+)?\s*[kK])\s*\/\/\s*([\d,]{4,8})/);
      if (slashFormat) {
        costPrice = this.parsePriceToken(slashFormat[1]);
        // Note: slashFormat[2] is the line total (quantity * costPrice), NOT sellingPrice!
        sellingPrice = costPrice + 2500;
        priceAutoFilled = true;
      }
    }

    // 3. Check shorthand "8K" / "10K"
    if (!costPrice) {
      const kMatch = text.match(/(?:\-\s*)?\b(\d{1,2}(?:\.\d+)?)\s*[kK]\b/);
      if (kMatch) {
        costPrice = Math.round(parseFloat(kMatch[1]) * 1000);
        sellingPrice = costPrice + 2200;
        priceAutoFilled = true;
      }
    }

    // 4. Check standalone 4-6 digit numbers if still not set
    if (!costPrice || !sellingPrice) {
      const withoutSlashTotal = text.split('//')[0];
      const priceCandidates = [...withoutSlashTotal.matchAll(/\b(\d{1,3}(?:,\d{3})+|\d{4,6})\b/g)]
        .map((m) => parseInt(m[1].replace(/,/g, ''), 10))
        .filter((n) => n >= 1500 && n <= 150000);

      if (priceCandidates.length >= 2) {
        const sorted = [priceCandidates[0], priceCandidates[1]].sort((a, b) => a - b);
        if (!costPrice) costPrice = sorted[0];
        if (!sellingPrice) sellingPrice = sorted[1];
      } else if (priceCandidates.length === 1) {
        if (!costPrice) costPrice = priceCandidates[0];
        if (!sellingPrice) {
          sellingPrice = costPrice + 2500;
          priceAutoFilled = true;
        }
      }
    }

    // 5. Fallback to existing inventory or catalog defaults if no price in note
    if (!costPrice || !sellingPrice) {
      priceAutoFilled = true;
      const sku =
        brand && model
          ? this.generateDeterministicSku(brand, model, storage, color || 'Black', condition)
          : '';
      const existing = sku
        ? existingInventory.find((i) => i.sku.toUpperCase() === sku.toUpperCase())
        : undefined;

      if (existing) {
        if (!costPrice) costPrice = existing.costPrice;
        if (!sellingPrice) sellingPrice = existing.sellingPrice;
      } else {
        const storageAddon =
          storage === '64GB'
            ? -1500
            : storage === '256GB'
            ? 2500
            : storage === '512GB'
            ? 5000
            : 0;
        const baseCost = (matchedCatalog ? matchedCatalog.baseCost128 : 13500) + storageAddon;
        const baseSell = (matchedCatalog ? matchedCatalog.baseSell128 : 16500) + storageAddon;
        if (!costPrice) costPrice = Math.max(2000, baseCost);
        if (!sellingPrice) sellingPrice = Math.max(costPrice + 2000, baseSell);
      }
    }

    return { costPrice, sellingPrice, priceAutoFilled };
  }

  private parsePriceToken(raw: string): number {
    const clean = raw.trim().toUpperCase();
    if (clean.endsWith('K')) {
      return Math.round(parseFloat(clean.replace('K', '')) * 1000);
    }
    return parseInt(clean.replace(/,/g, ''), 10) || 0;
  }

  private toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  }
}
