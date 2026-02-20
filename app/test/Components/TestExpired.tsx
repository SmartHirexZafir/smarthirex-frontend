// app/test/Components/TestExpired.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";

type Props = {
  message?: string;
  onBack?: () => void;
};

export default function TestExpired({ message, onBack }: Props) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 text-foreground p-8 shadow-sm">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center">
              <div className="text-5xl">⏱️</div>
            </div>
            <div className="absolute top-0 right-0 h-8 w-8 rounded-full bg-destructive border-2 border-background flex items-center justify-center">
              <span className="text-white font-bold text-sm">!</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-3 text-destructive">Test Time Expired</h1>

        {/* Message */}
        <div className="bg-destructive/5 rounded-lg border border-destructive/20 p-4 mb-6">
          <p className="text-center text-base text-destructive/90">
            {message || "The allotted time for this test has expired. You can no longer submit answers."}
          </p>
        </div>

        {/* Details */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <h3 className="font-semibold mb-4">What happened?</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-destructive font-bold flex-shrink-0">•</span>
              <span>Your test duration has reached its limit, and the submission window has closed.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-destructive font-bold flex-shrink-0">•</span>
              <span>Server time is always used to determine expiration, not your device's local time.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-destructive font-bold flex-shrink-0">•</span>
              <span>No additional attempts or extensions are available for this test.</span>
            </li>
          </ul>
        </div>

        {/* Next Steps */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <h3 className="font-semibold mb-4">Next steps</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please contact the hiring team if you believe this is an error or need to reschedule your assessment.
          </p>
          <div className="space-y-2">
            <p className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground">
              Reference: Test Submission Deadline Passed
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center gap-3">
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Return to Home
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            If you have questions about your test, please reach out to the hiring team using your original invitation email.
          </p>
        </div>
      </div>
    </div>
  );
}
