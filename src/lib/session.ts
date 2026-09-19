import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Oturum bilgisi JWT çerezinde tutulur ve veritabanına bakılmadan doğrulanır.
// Veritabanı sıfırlanır/yeniden oluşturulursa çerezdeki kullanıcı artık mevcut
// olmayabilir; bu durumda sayfalar açılır ama kayıt işlemleri foreign key
// hatasıyla çökerdi. Bu yüzden kullanıcının gerçekten var olduğunu da
// doğruluyoruz; yoksa oturum geçersiz sayılıp yeniden giriş istenir.
export async function getValidSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  return user ? session : null;
}

export async function requireSession() {
  const session = await getValidSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
