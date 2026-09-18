"use client";

import { useState } from "react";

type Topic = { id: string; name: string };
type Subject = { id: string; name: string; topics: Topic[] };

export default function SubjectTopicSelect({
  subjects,
  required = true,
  topicOptional = true,
}: {
  subjects: Subject[];
  required?: boolean;
  topicOptional?: boolean;
}) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
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
          onChange={(e) => setSubjectId(e.target.value)}
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
        <select name="topicId" className="input" defaultValue="">
          <option value="">Seçilmedi</option>
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
