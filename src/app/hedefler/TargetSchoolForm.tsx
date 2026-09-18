"use client";

import { createTargetSchool } from "./actions";

export default function TargetSchoolForm() {
  return (
    <form action={createTargetSchool} className="card space-y-3">
      <h2 className="font-semibold text-gray-900">Tek Okul Ekle</h2>
      <div>
        <label className="label">Okul adı</label>
        <input name="name" className="input" placeholder="Örn: Kadıköy Anadolu Lisesi" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Hedef net (0-90)</label>
          <input
            type="number"
            name="targetNet"
            className="input"
            min={1}
            max={90}
            step={0.5}
            placeholder="Örn: 78"
            required
          />
        </div>
        <div>
          <label className="label">Not (opsiyonel)</label>
          <input name="note" className="input" placeholder="Örn: 2025 taban puanı" />
        </div>
      </div>
      <button type="submit" className="btn-primary">
        Okul Ekle
      </button>
    </form>
  );
}
