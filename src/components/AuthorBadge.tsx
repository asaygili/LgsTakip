export type Author = { name: string; role: string } | null;

/**
 * Kaydı kimin girdiğini gösterir. Veli ve öğrenci aynı verileri girdiği için
 * her kaydın yanında kimin eklediği yazar.
 */
export default function AuthorBadge({ user }: { user: Author }) {
  if (!user) return null;

  const isStudent = user.role === "STUDENT";
  return (
    <span
      className={`badge ${
        isStudent ? "bg-violet-50 text-violet-700" : "bg-sky-50 text-sky-700"
      }`}
    >
      {user.name} ekledi
    </span>
  );
}
