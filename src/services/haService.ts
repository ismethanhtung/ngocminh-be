import { PrismaClient } from '@prisma/client';
import zlib from 'zlib';

const prisma = new PrismaClient({ log: ['error', 'warn'] });

export class HAService {
  private parseToBuffer(value: any): Buffer | null {
    if (value == null) return null;
    if (Buffer.isBuffer(value)) return value as Buffer;
    if (Array.isArray(value) && value.every(n => Number.isInteger(n))) {
      try {
        return Buffer.from(value as number[]);
      } catch {
        return null;
      }
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      // Thử parse chuỗi JSON dạng "[31,139,...]"
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const arr = JSON.parse(trimmed);
          if (Array.isArray(arr)) return Buffer.from(arr);
        } catch {
          // bỏ qua
        }
      }
      // Thử hex thuần
      if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0) {
        try {
          return Buffer.from(trimmed, 'hex');
        } catch {
          // bỏ qua
        }
      }
      // Thử base64
      try {
        return Buffer.from(trimmed, 'base64');
      } catch {
        return null;
      }
    }
    return null;
  }

  private tryDecompressToBuffer(value: any): Buffer | null {
    const buf = this.parseToBuffer(value);
    if (!buf || buf.length === 0) return null;
    const isGzip = buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b;
    try {
      if (isGzip) return zlib.gunzipSync(buf);
      try {
        return zlib.inflateSync(buf);
      } catch {
        return zlib.inflateRawSync(buf);
      }
    } catch {
      return null;
    }
  }

  private decodeBufferToUtf8(buf: Buffer): string {
    try {
      return buf.toString('utf8');
    } catch {
      return buf.toString();
    }
  }

  private tryDecodeToText(value: any): string | null {
    // Nếu là bytes nén → giải nén → utf8
    const decomp = this.tryDecompressToBuffer(value);
    if (decomp) return this.decodeBufferToUtf8(decomp);
    // Nếu không nén: thử coi là bytes/text thô
    if (Buffer.isBuffer(value)) return this.decodeBufferToUtf8(value as Buffer);
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && value.every(n => Number.isInteger(n))) {
      try {
        return this.decodeBufferToUtf8(Buffer.from(value as number[]));
      } catch {
        // tiếp tục
      }
    }
    const buf = this.parseToBuffer(value);
    if (buf) return this.decodeBufferToUtf8(buf);
    return null;
  }

  private rtfToPlainText(rtfText: string | null): string | null {
    if (!rtfText) return null;
    const text = rtfText;
    if (!text.startsWith('{\\rtf')) return text;
    let out = text;
    // \uXXXX (có thể kèm \'hh) → ký tự Unicode
    out = out.replace(/\\u(-?\d+)(?:\\'..)?/g, (_m, g1) => {
      const code = parseInt(g1, 10);
      const normalized = code < 0 ? 65536 + code : code;
      try {
        return String.fromCodePoint(normalized);
      } catch {
        return '';
      }
    });
    // \par → newline
    out = out.replace(/\\par[d]?/g, '\n');
    // Bỏ control word còn lại
    out = out.replace(/\\[a-zA-Z]+-?\d* ?/g, '');
    // Bỏ escape \'hh
    out = out.replace(/\\'[0-9a-fA-F]{2}/g, '');
    // Bỏ ngoặc nhóm
    out = out.replace(/[{}]/g, '');
    // Gọn whitespace
    out = out
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return out;
  }

  // 1) Từ FileNum lấy tất cả đợt khám trong ViewHAResult, sort theo StartDate
  async getHAResultsByFileNum(fileNum: string) {
    const results = await prisma.$queryRawUnsafe(`
      SELECT *
      FROM ViewHAResult
      WHERE FileNum = '${fileNum.replace(/'/g, "''")}'
      ORDER BY StartDate DESC
    `);
    return results as any[];
  }

  // 2) Khám lâm sàng: từ id của ViewHAResult -> ViewHAResultItem (ResultId = id)
  async getClinicalItemsByResultId(resultId: number) {
    const items = await prisma.$queryRawUnsafe(`
      SELECT *
      FROM ViewHAResultItem
      WHERE ResultId = ${Number(resultId)}
      ORDER BY Id DESC
    `);
    return items as any[];
  }

  // 3) Xét nghiệm huyết học, sinh hóa: từ Id của ViewHAResult -> ViewHAPathologyResult (ResultId = Id)
  async getPathologyByResultId(resultId: number) {
    const pathologies = await prisma.$queryRawUnsafe(`
      SELECT *
      FROM ViewHAPathologyResult
      WHERE ResultId = ${Number(resultId)}
      ORDER BY Id DESC
    `);
    return pathologies as any[];
  }

  // 4) Chẩn đoán hình ảnh theo flow mô tả
  // - Input: ItemNum (lấy từ ViewHAResult)
  // - Lấy SessionId bằng ItemNum trong ViewHAResult (bản ghi mới nhất)
  // - Từ SessionId => ViewImagingResult (lọc theo SessionId) => lấy Id (1-n)
  // - Với mỗi Id => CN_ImagingResultData theo ImageRessultId (chú ý có thể là cột ResultId/ImagingResultId)
  async getImagingChainByItemNum(itemNum: number | string) {
    const safeItemNumStr = String(itemNum).replace(/'/g, "''");

    const sessionRow = await prisma.$queryRawUnsafe(`
      SELECT TOP 1 SessionId
      FROM ViewHAResult
      WHERE ItemNum = '${safeItemNumStr}'
      ORDER BY StartDate DESC
    `);

    const sessionId = (sessionRow as any[])?.[0]?.SessionId;
    if (!sessionId) return { sessionId: null, imagingResults: [], imagingData: [] };

    const imagingResults = (await prisma.$queryRawUnsafe(`
      SELECT *
      FROM ViewImagingResult
      WHERE SessionId = ${Number(sessionId)}
      ORDER BY Id DESC
    `)) as any[];

    const imagingIds: number[] = [];
    imagingResults.forEach(r => {
      if (r && r.Id != null) imagingIds.push(Number(r.Id));
    });

    let imagingData: any[] = [];
    if (imagingIds.length > 0) {
      const ids = imagingIds.join(',');
      // thử các cột khoá ngoại phổ biến
      const byResultId = await prisma
        .$queryRawUnsafe(
          `
        SELECT * FROM CN_ImagingResultData WHERE ResultId IN (${ids})
      `
        )
        .catch(() => []);

      if (Array.isArray(byResultId) && byResultId.length > 0) {
        imagingData = byResultId as any[];
      } else {
        const byImagingResultId = await prisma
          .$queryRawUnsafe(
            `
          SELECT * FROM CN_ImagingResultData WHERE ImagingResultId IN (${ids})
        `
          )
          .catch(() => []);
        if (Array.isArray(byImagingResultId) && byImagingResultId.length > 0) {
          imagingData = byImagingResultId as any[];
        } else {
          const byImageRessultId = await prisma
            .$queryRawUnsafe(
              `
            SELECT * FROM CN_ImagingResultData WHERE ImageRessultId IN (${ids})
          `
            )
            .catch(() => []);
          imagingData = (byImageRessultId as any[]) || [];
        }
      }
    }

    // Giải nén/giải mã + chuyển RTF → plain text nếu có
    const decompressed = imagingData.map(row => {
      const rawResult = row?.ResultData ?? row?.Result;
      const rawConclusion = row?.ConclusionData ?? row?.Conclusion;
      const rawSuggestion = row?.SuggestionData ?? row?.Suggestion;

      const resultText = this.tryDecodeToText(rawResult);
      const conclusionText = this.tryDecodeToText(rawConclusion);
      const suggestionText = this.tryDecodeToText(rawSuggestion);

      const resultPlain = this.rtfToPlainText(resultText);
      const conclusionPlain = this.rtfToPlainText(conclusionText);
      const suggestionPlain = this.rtfToPlainText(suggestionText);

      return {
        ...row,
        ResultText: resultText ?? null,
        ConclusionText: conclusionText ?? null,
        SuggestionText: suggestionText ?? null,
        ResultPlain: resultPlain ?? null,
        ConclusionPlain: conclusionPlain ?? null,
        SuggestionPlain: suggestionPlain ?? null,
      };
    });

    return { sessionId, imagingResults, imagingData: decompressed };
  }
}
