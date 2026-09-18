import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CURRICULUM: Record<string, string[]> = {
  Türkçe: [
    "Sözcükte Anlam",
    "Cümlede Anlam",
    "Paragrafta Anlam",
    "Söz Sanatları",
    "Fiilimsi",
    "Cümlenin Öğeleri",
    "Fiilde Çatı",
    "Anlatım Bozuklukları",
    "Yazım Kuralları",
    "Noktalama İşaretleri",
  ],
  Matematik: [
    "Çarpanlar ve Katlar",
    "Üslü İfadeler",
    "Kareköklü İfadeler",
    "Veri Analizi",
    "Basit Olayların Olma Olasılığı",
    "Cebirsel İfadeler ve Özdeşlikler",
    "Doğrusal Denklemler",
    "Eşitsizlikler",
    "Üçgenler",
    "Eşlik ve Benzerlik",
    "Dönüşüm Geometrisi",
    "Geometrik Cisimler",
  ],
  "Fen Bilimleri": [
    "Mevsimler ve İklim",
    "DNA ve Genetik Kod",
    "Basınç",
    "Madde ve Endüstri",
    "Basit Makineler",
    "Enerji Dönüşümleri ve Çevre Bilimi",
    "Elektrik Yükleri ve Elektrik Enerjisi",
  ],
  "T.C. İnkılap Tarihi ve Atatürkçülük": [
    "Bir Kahraman Doğuyor",
    "Milli Uyanış: Bağımsızlık Yolunda Atılan Adımlar",
    "Milli Bir Destan: Ya İstiklal Ya Ölüm",
    "Atatürkçülük ve Çağdaşlaşan Türkiye",
    "Demokratikleşme Çabaları",
    "Atatürk Dönemi Türk Dış Politikası",
    "Atatürk'ün Ölümü ve Sonrası",
  ],
  "Din Kültürü ve Ahlak Bilgisi": [
    "Kader İnancı",
    "Zekât, Sadaka ve Hac",
    "Din ve Hayat",
    "Hz. Muhammed'in Örnekliği",
    "Kur'an-ı Kerim ve Özellikleri",
  ],
  İngilizce: [
    "Friendship",
    "Teen Life",
    "In the Kitchen",
    "On the Phone",
    "The Internet",
    "Adventures",
    "Tourism",
    "Chores",
    "Science",
    "Natural Forces",
  ],
};

async function main() {
  const subjectNames = Object.keys(CURRICULUM);

  for (let i = 0; i < subjectNames.length; i++) {
    const name = subjectNames[i];
    const subject = await prisma.subject.upsert({
      where: { name },
      update: { order: i },
      create: { name, order: i },
    });

    const topics = CURRICULUM[name];
    for (let j = 0; j < topics.length; j++) {
      await prisma.topic.upsert({
        where: { subjectId_name: { subjectId: subject.id, name: topics[j] } },
        update: { order: j },
        create: { name: topics[j], order: j, subjectId: subject.id },
      });
    }
  }

  const parentPasswordHash = await bcrypt.hash("veli1234", 10);
  const studentPasswordHash = await bcrypt.hash("ogrenci1234", 10);

  await prisma.user.upsert({
    where: { username: "veli" },
    update: {},
    create: {
      username: "veli",
      name: "Veli",
      role: "PARENT",
      passwordHash: parentPasswordHash,
    },
  });

  await prisma.user.upsert({
    where: { username: "ogrenci" },
    update: {},
    create: {
      username: "ogrenci",
      name: "Öğrenci",
      role: "STUDENT",
      passwordHash: studentPasswordHash,
    },
  });

  console.log("Seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
