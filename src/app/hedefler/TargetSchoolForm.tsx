"use client";

import { createTargetSchool } from "./actions";

export default function TargetSchoolForm() {
  return (
    <form action={createTargetSchool} className="card space-y-3">
      <h2 className="font-semibold text-gray-900">Tek Okul Ekle</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Okul adı</label>
          <input name="name" className="input" placeholder="Örn: Ankara Fen Lisesi" required />
        </div>
        <div>
          <label className="label">İl / İlçe (opsiyonel)</label>
          <input name="location" className="input" placeholder="Örn: Ankara / Çankaya" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Hedef yüzdelik dilim</label>
          <input
            type="number"
            name="targetPercentile"
            className="input"
            min={0.01}
            max={100}
            step={0.01}
            placeholder="Örn: 0.09"
            required
          />
        </div>
        <div>
          <label className="label">Taban puanı (opsiyonel)</label>
          <input type="number" name="cutoffScore" className="input" step={0.0001} placeholder="Örn: 494.42" />
        </div>
      </div>
      <div>
        <label className="label">Not (opsiyonel)</label>
        <input name="note" className="input" placeholder="Örn: 2025 verisi" />
      </div>
      <button type="submit" className="btn-primary">
        Okul Ekle
      </button>
    </form>
  );
}
