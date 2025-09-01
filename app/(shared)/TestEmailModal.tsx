// app/(shared)/TestEmailModal.tsx
// Uses modal + button + input utilities defined in globals.css.

"use client";

import React, { useEffect, useMemo, useState } from "react";

type CandidateLike = {
  _id: string;
  name?: string;
  email?: string;
  resume?: { email?: string };
  job_role?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  candidate: CandidateLike | null;
};

// Resolve API base safely, supporting both env names
function resolveApiBase() {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "http://localhost:10000";
  return String(raw).replace(/\/$/, "");
}

function getCandidateEmail(c?: CandidateLike | null) {
  return c?.email || c?.resume?.email || "";
}

function defaultSubject(role?: string) {
  const r = role && role.trim() ? role : "Role";
  return `Your ${r} assessment – SmartHirex`;
}

function defaultBodyHTML(name?: string, role?: string) {
  const displayName = name && name.trim() ? name : "there";
  const r = role && role.trim() ? role : "role";
  // NOTE: {TEST_LINK} will be replaced by backend with the real link
  return `
<p>Hi <strong>${displayName}</strong>,</p>
<p>You’re invited to take a short <strong>${r}</strong> assessment tailored to your experience.</p>
<p>When you’re ready, click this link to begin:<br/>
  <a href="{TEST_LINK}">{TEST_LINK}</a>
</p>
<p>Good luck!<br/>SmartHirex Team</p>
  `.trim();
}

// clamp helper for question count
function clampQuestionCount(n: number) {
  if (Number.isNaN(n)) return 4;
  return Math.min(50, Math.max(1, Math.floor(n)));
}

export default function TestEmailModal({ open, onClose, candidate }: Props) {
  const API_BASE = useMemo(() => resolveApiBase(), []);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [questionCount, setQuestionCount] = useState<number>(4);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentInfo, setSentInfo] =
    useState<null | { test_link: string; email: string }>(null);

  const role = useMemo(() => candidate?.job_role || "Role", [candidate]);

  // hydrate defaults whenever modal opens for a new candidate
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSentInfo(null);
    setTo(getCandidateEmail(candidate));
    setSubject(defaultSubject(role));
    setBodyHtml(defaultBodyHTML(candidate?.name, role));
    setQuestionCount(4); // default each time modal opens
  }, [open, candidate, role]);

  if (!open || !candidate) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !sending) onClose();
  };

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSentInfo(null);

    if (!candidate?._id) {
      setError("Candidate ID missing.");
      return;
    }
    if (!to) {
      setError("Recipient email is required.");
      return;
    }
    if (!subject.trim()) {
      setError("Subject cannot be empty.");
      return;
    }
    if (!bodyHtml.trim()) {
      setError("Email body cannot be empty.");
      return;
    }
    const qc = clampQuestionCount(questionCount);

    // Abort after 20s to avoid hanging UI
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);

    try {
      setSending(true);
      const res = await fetch(`${API_BASE}/tests/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidate._id,
          subject,
          body_html: bodyHtml, // backend will replace {TEST_LINK}
          // allow sender to choose number of questions
          question_count: qc,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Failed with status ${res.status}`);
      }

      const data = (await res.json().catch(() => null)) as
        | {
            invite_id: string;
            token: string;
            test_link: string;
            email: string;
            sent: boolean;
            expires_at: string;
          }
        | null;

      if (!data || !data.test_link) {
        throw new Error("Unexpected server response.");
      }

      setSentInfo({ test_link: data.test_link, email: data.email });
    } catch (err: any) {
      const aborted = err?.name === "AbortError";
      setError(
        aborted
          ? "Request timed out. Please try again."
          : err?.message || "Failed to send email."
      );
    } finally {
      window.clearTimeout(timeout);
      setSending(false);
    }
  }

  const canSend =
    !sending &&
    !!to &&
    !!subject.trim() &&
    !!bodyHtml.trim() &&
    questionCount >= 1 &&
    questionCount <= 50;

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      {/* Modal Card (uses .modal from globals.css) */}
      <div className="modal !max-w-2xl">
        {/* Header */}
        <div className="relative border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[hsl(var(--g1))] to-[hsl(var(--g3))] text-white flex items-center justify-center shadow-glow">
              <i className="ri-mail-send-line text-base" aria-hidden />
            </div>
            <div>
              <h3 className="text-lg font-semibold leading-tight">Send Test</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Email an assessment link to the candidate.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute right-0 top-0 icon-btn"
            aria-label="Close"
            disabled={sending}
            title="Close"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSend} className="space-y-5 pt-5">
          {/* To (read-only, derived from candidate) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              To
            </label>
            <input type="email" value={to} readOnly className="input bg-muted/40" />
            {!to && (
              <p className="mt-1 text-xs text-destructive">
                No email found on candidate profile. Add email to continue.
              </p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your assessment invitation"
              className="input"
            />
          </div>

          {/* Number of questions */}
          <div>
            <div className="flex items-center justify-between">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Number of questions
              </label>
              <span className="text-xs text-muted-foreground/80">
                1–50 (default 4)
              </span>
            </div>
            <input
              type="number"
              min={1}
              max={50}
              step={1}
              value={questionCount}
              onChange={(e) =>
                setQuestionCount(clampQuestionCount(Number(e.target.value)))
              }
              className="input w-40"
            />
            {questionCount < 1 || questionCount > 50 ? (
              <p className="mt-1 text-xs text-destructive">
                Please choose between 1 and 50.
              </p>
            ) : null}
          </div>

          {/* Body (HTML) */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-muted-foreground">
                Message (HTML)
              </label>
              <span className="text-xs text-muted-foreground">
                Use <code className="rounded bg-muted/60 px-1">{"{TEST_LINK}"}</code>{" "}
                where the link should appear
              </span>
            </div>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              placeholder={`Hi ${candidate.name || "there"},\n\nClick {TEST_LINK} to begin…`}
              className="textarea h-44 font-mono"
            />
          </div>

          {/* Alerts */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {sentInfo ? (
            <div className="rounded-xl border border-success/30 bg-success/10 px-3 py-3 text-sm text-success-foreground">
              <div className="font-medium text-success">Invitation sent!</div>
              <div className="mt-1">
                Sent to <span className="font-medium">{sentInfo.email}</span>
              </div>
              <div className="mt-1 break-all">
                Test link:{" "}
                <a
                  className="underline text-primary"
                  href={sentInfo.test_link}
                  target="_blank"
                  rel="noreferrer"
                >
                  {sentInfo.test_link}
                </a>
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={onClose} className="btn btn-ghost">
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSend}
                className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
