"use client";

import { useTransition } from "react";
import { updateTopicStatus } from "./actions";
import { TOPIC_STATUS_LABELS, TOPIC_STATUS_COLORS } from "@/lib/labels";

export default function TopicStatusPicker({
  topicId,
  status,
}: {
  topicId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      disabled={isPending}
      value={status}
      onChange={(e) => startTransition(() => updateTopicStatus(topicId, e.target.value))}
      className={`rounded-lg border-0 px-2 py-1 text-xs font-medium ${TOPIC_STATUS_COLORS[status]}`}
    >
      {Object.entries(TOPIC_STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
