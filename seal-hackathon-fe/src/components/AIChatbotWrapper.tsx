"use client";
import dynamic from "next/dynamic";

const AIChatbot = dynamic(() => import("./AIChatbot"), { 
  ssr: false, 
  loading: () => null 
});

export default function AIChatbotWrapper() {
  return <AIChatbot />;
}
