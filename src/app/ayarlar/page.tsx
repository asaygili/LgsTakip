import { requireSession } from "@/lib/session";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function AyarlarPage() {
  const session = await requireSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-sm text-gray-500">
          {session.user.name} hesabının şifresini buradan değiştirebilirsiniz.
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
