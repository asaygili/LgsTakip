// Bağımlılık eklemeden ZIP üretir. Dosyalar sıkıştırılmadan ("store") yazılır:
// içerideki fotoğraflar zaten JPEG, tekrar sıkıştırmak yer kazandırmaz ama CPU
// ve bellek harcar. Akış (stream) olarak üretildiği için aynı anda yalnızca tek
// bir dosya bellekte durur; yedek büyüdükçe sunucu şişmez.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** ZIP, MS-DOS tarih/saat biçimi kullanır (2 saniyelik çözünürlük). */
function dosDateTime(d: Date) {
  const time =
    ((d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | Math.floor(d.getUTCSeconds() / 2)) &
    0xffff;
  const date =
    (((d.getUTCFullYear() - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate()) & 0xffff;
  return { time, date };
}

export type ZipEntry = { name: string; data: Uint8Array };

type CentralRecord = {
  nameBytes: Uint8Array;
  crc: number;
  size: number;
  offset: number;
  time: number;
  date: number;
};

const LOCAL_HEADER = 0x04034b50;
const CENTRAL_HEADER = 0x02014b50;
const END_OF_CENTRAL = 0x06054b50;
// 0x0800: dosya adları UTF-8; Türkçe karakterler bozulmasın.
const UTF8_FLAG = 0x0800;

function localHeader(entry: CentralRecord) {
  const buf = new Uint8Array(30 + entry.nameBytes.length);
  const view = new DataView(buf.buffer);
  view.setUint32(0, LOCAL_HEADER, true);
  view.setUint16(4, 20, true); // gereken sürüm
  view.setUint16(6, UTF8_FLAG, true);
  view.setUint16(8, 0, true); // yöntem: store
  view.setUint16(10, entry.time, true);
  view.setUint16(12, entry.date, true);
  view.setUint32(14, entry.crc, true);
  view.setUint32(18, entry.size, true); // sıkıştırılmış
  view.setUint32(22, entry.size, true); // ham
  view.setUint16(26, entry.nameBytes.length, true);
  view.setUint16(28, 0, true); // extra yok
  buf.set(entry.nameBytes, 30);
  return buf;
}

function centralHeader(entry: CentralRecord) {
  const buf = new Uint8Array(46 + entry.nameBytes.length);
  const view = new DataView(buf.buffer);
  view.setUint32(0, CENTRAL_HEADER, true);
  view.setUint16(4, 20, true); // üreten sürüm
  view.setUint16(6, 20, true); // gereken sürüm
  view.setUint16(8, UTF8_FLAG, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, entry.time, true);
  view.setUint16(14, entry.date, true);
  view.setUint32(16, entry.crc, true);
  view.setUint32(20, entry.size, true);
  view.setUint32(24, entry.size, true);
  view.setUint16(28, entry.nameBytes.length, true);
  view.setUint16(30, 0, true); // extra
  view.setUint16(32, 0, true); // yorum
  view.setUint16(34, 0, true); // disk
  view.setUint16(36, 0, true); // iç öznitelik
  view.setUint32(38, 0, true); // dış öznitelik
  view.setUint32(42, entry.offset, true);
  buf.set(entry.nameBytes, 46);
  return buf;
}

function endOfCentralDirectory(count: number, size: number, offset: number) {
  const buf = new Uint8Array(22);
  const view = new DataView(buf.buffer);
  view.setUint32(0, END_OF_CENTRAL, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, count, true);
  view.setUint16(10, count, true);
  view.setUint32(12, size, true);
  view.setUint32(16, offset, true);
  view.setUint16(20, 0, true);
  return buf;
}

/** ZIP biçiminin (ZIP64 olmadan) taşıyabileceği en fazla dosya sayısı. */
export const MAX_ZIP_ENTRIES = 65535;

export function createZipStream(entries: AsyncIterable<ZipEntry>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const central: CentralRecord[] = [];
  let offset = 0;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      // Tüm akış tek pull içinde üretilir; her adımda yalnızca bir dosya
      // bellekte tutulur.
      try {
        const now = new Date();
        const { time, date } = dosDateTime(now);

        for await (const entry of entries) {
          if (central.length >= MAX_ZIP_ENTRIES) break;

          const nameBytes = encoder.encode(entry.name);
          const record: CentralRecord = {
            nameBytes,
            crc: crc32(entry.data),
            size: entry.data.length,
            offset,
            time,
            date,
          };
          const header = localHeader(record);
          controller.enqueue(header);
          controller.enqueue(entry.data);
          offset += header.length + entry.data.length;
          central.push(record);
        }

        const centralStart = offset;
        let centralSize = 0;
        for (const record of central) {
          const header = centralHeader(record);
          controller.enqueue(header);
          centralSize += header.length;
        }
        controller.enqueue(endOfCentralDirectory(central.length, centralSize, centralStart));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
