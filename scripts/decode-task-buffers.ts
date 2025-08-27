import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

type MaybeBuffer = null | { type: string; data: number[] };

function safeGunzip(buffer: Buffer): { decoded?: string; note: string } {
  try {
    const unzipped = zlib.gunzipSync(buffer);
    // Try utf8
    const text = unzipped.toString('utf8');
    return { decoded: text, note: 'gunzip->utf8' };
  } catch (e) {
    return { note: 'gunzip failed' };
  }
}

function detectFormat(buffer: Buffer): string {
  if (buffer.length === 0) return 'empty';
  const head = buffer.slice(0, 8);
  const headStr = head.toString('utf8');
  // GZIP magic 1F 8B
  if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) return 'gzip-compressed';
  // PDF
  if (headStr.startsWith('%PDF')) return 'pdf';
  // ZIP (DOCX/XLSX/PPTX are zip-based) - PK\x03\x04
  if (
    head.length >= 4 &&
    head[0] === 0x50 &&
    head[1] === 0x4b &&
    head[2] === 0x03 &&
    head[3] === 0x04
  )
    return 'zip-archive (docx/xlsx/pptx or other zip)';
  // RTF
  if (headStr.startsWith('{\\rtf')) return 'rtf';
  // PNG
  if (
    head.length >= 8 &&
    head.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return 'png image';
  // JPG
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff)
    return 'jpeg image';
  // DICOM (simplistic check: DICM at offset 128)
  if (buffer.length > 132 && buffer.slice(128, 132).toString() === 'DICM') return 'dicom image';
  return 'unknown-binary';
}

function maybeDecode(bufferLike: MaybeBuffer): { preview: string; format: string; raw?: Buffer } {
  if (!bufferLike) return { preview: '(null)', format: 'null' };
  if (bufferLike.type !== 'Buffer' || !Array.isArray(bufferLike.data)) {
    return {
      preview: JSON.stringify(bufferLike).slice(0, 2000),
      format: 'not-node-buffer-structure',
    };
  }
  const buf = Buffer.from(bufferLike.data);
  const fmt = detectFormat(buf);
  if (fmt === 'gzip-compressed') {
    const gunzipped = safeGunzip(buf);
    if (gunzipped.decoded) {
      const text = gunzipped.decoded;
      return {
        preview: text.length > 4000 ? text.slice(0, 4000) + '\n...[truncated]...' : text,
        format: 'text (gzip -> utf8)',
      };
    }
    return { preview: '(gzip nhưng giải nén thất bại)', format: fmt };
  }
  // Try plain utf8 if printable ratio is high
  const utf8 = buf.toString('utf8');
  const printableRatio =
    utf8
      .split('')
      .filter(
        c =>
          (c.charCodeAt(0) >= 9 && c.charCodeAt(0) <= 126) || c === '\n' || c === '\r' || c === '\t'
      ).length / utf8.length;
  if (utf8.length > 0 && printableRatio > 0.8) {
    return {
      preview: utf8.length > 4000 ? utf8.slice(0, 4000) + '\n...[truncated]...' : utf8,
      format: 'text (utf8?)',
    };
  }
  return { preview: '(nhị phân, không thể hiển thị dưới dạng text)', format: fmt };
}

function main() {
  const filePath = path.resolve(__dirname, '../task.md');
  const rawAll = fs.readFileSync(filePath, 'utf8');
  // Tìm khối JSON: từ ký tự '{' đầu tiên đến '}' cuối cùng
  const start = rawAll.indexOf('{');
  const end = rawAll.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Không tìm thấy khối JSON hợp lệ trong task.md');
  }
  const raw = rawAll.slice(start, end + 1);
  const data = JSON.parse(raw);
  const imagingData: Array<{
    ImagingResultId: number;
    ResultData: MaybeBuffer;
    ConclusionData: MaybeBuffer;
    SuggestionData: MaybeBuffer;
  }> = data?.data?.imagingData ?? [];

  for (const item of imagingData) {
    console.log('==============================');
    console.log(`ImagingResultId: ${item.ImagingResultId}`);

    const rd = maybeDecode(item.ResultData);
    console.log('ResultData format:', rd.format);
    console.log('ResultData preview:');
    console.log(rd.preview);

    const cd = maybeDecode(item.ConclusionData);
    console.log('---');
    console.log('ConclusionData format:', cd.format);
    console.log('ConclusionData preview:');
    console.log(cd.preview);

    const sd = maybeDecode(item.SuggestionData);
    console.log('---');
    console.log('SuggestionData format:', sd.format);
    console.log('SuggestionData preview:');
    console.log(sd.preview);
  }
}

main();
