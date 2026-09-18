"use client";

import { createMockExam } from "./actions";
import { EXAM_TYPE_LABELS } from "@/lib/labels";

type Subject = { id: string; name: string };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function MockExamForm({ subjects }: { subjects: Subject[] }) {
  return (
    <form action={createMockExam} className="card space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Deneme adı</label>
          <input name="name" className="input" placeholder="Örn: 3. Deneme" required />
        </div>
        <div>
          <label className="label">Tarih</label>
          <input type="date" name="date" className="input" defaultValue={todayStr()} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tür</label>
          <select name="type" className="input" defaultValue="GENEL">
            {Object.entries(EXAM_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tahmini yüzdelik dilim (opsiyonel)</label>
          <input
            type="number"
            name="estimatedPercentile"
            className="input"
            min={0}
            max={100}
            step={0.01}
            placeholder="Örn: 1.25"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Yüzdelik dilim, kullandığınız deneme sonuç sisteminin verdiği tahmini sıralama yüzdesidir
        (küçük değer = daha iyi sıralama). Hedef Okullar sayfasındaki karşılaştırma için kullanılır.
      </p>

      <div className="space-y-2">
        <label className="label">Ders sonuçları</label>
        <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-500">
          <span>Ders</span>
          <span>Doğru</span>
          <span>Yanlış</span>
          <span>Boş</span>
        </div>
        {subjects.map((s) => (
          <div key={s.id} className="grid grid-cols-4 items-center gap-2">
            <label className="flex items-center gap-1.5 text-sm text-gray-700">
              <input type="hidden" name="subjectIds" value={s.id} />
              {s.name}
            </label>
            <input type="number" min={0} name={`correct_${s.id}`} className="input" defaultValue={0} />
            <input type="number" min={0} name={`wrong_${s.id}`} className="input" defaultValue={0} />
            <input type="number" min={0} name={`blank_${s.id}`} className="input" defaultValue={0} />
          </div>
        ))}
      </div>

      <button type="submit" className="btn-primary">
        Deneme Sonucunu Kaydet
      </button>
    </form>
  );
}
