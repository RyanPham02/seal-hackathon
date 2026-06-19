"use client";
import { use } from "react";
import ScoreSubmissionForm from "@/components/ScoreSubmissionForm";

export default function JudgingScorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ScoreSubmissionForm submissionId={id} backHref="/dashboard/judging" />;
}
