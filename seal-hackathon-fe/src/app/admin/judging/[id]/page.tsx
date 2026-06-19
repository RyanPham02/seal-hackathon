"use client";
import { use } from "react";
import ScoreSubmissionForm from "@/components/ScoreSubmissionForm";

export default function AdminJudgingScorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ScoreSubmissionForm submissionId={id} backHref="/admin/judging" readOnly={true} />;
}
