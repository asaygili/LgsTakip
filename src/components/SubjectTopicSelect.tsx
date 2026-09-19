"use client";

import { useState } from "react";

type Topic = { id: string; name: string };
type Subject = { id: string; name: string; topics: Topic[] };

export default function SubjectTopicSelect({
  subjects,
  required = true,
  topicOptional = true,
  defaultSubjectId,
  defaultTopicId,
  topicDisabled = false,
  topicDisabledHint,
}: {
  subjects: Subject[];
  required?: boolean;
  topicOptional?: boolean;
  defaultSubjectId?: string;
  defaultTopicId?: string | null;
  /** Karma test gibi tek konuya bağlanamayan kayıtlarda konu seçimi kapatılır. */
  topicDisabled?: boolean;
  topicDisabledHint?: string;
}) {
  const [subjectId, setSubjectId] = useState(
    defaultSubjectId ?? subjects[0]?.id ?? ""
  );
  // Konu da denetimli: ders değişince önceki dersin konusu formda kalmasın.
  const [topicId, setTopicId] = useState(defaultTopicId ?? "");
  const selectedSubject = subjects.find((s) => s.id === subjectId);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="label">Ders</label>
        <select
          name="subjectId"
          className="input"
          required={required}
          value={subjectId}
          onChange={(e) => {
            setSubjectId(e.target.value);
            setTopicId("");
          }}
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Konu {topicOptional && "(opsiyonel)"}</label>
        {/* Kapalıyken select disabled olur; tarayıcı disabled alanı göndermez,
            böylece kayda konu yazılmaz. */}
        <select
          name="topicId"
          className="input disabled:bg-gray-100 disabled:text-gray-400"
          value={topicDisabled ? "" : topicId}
          disabled={topicDisabled}
          onChange={(e) => setTopicId(e.target.value)}
        >
          <option value="">{topicDisabled ? (topicDisabledHint ?? "-") : "Seçilmedi"}</option>
          {selectedSubject?.topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
