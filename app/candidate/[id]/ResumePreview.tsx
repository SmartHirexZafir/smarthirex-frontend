// app/candidate/[id]/ResumePreview.tsx
"use client";

import React, { useMemo, useState } from "react";

/* ===================== Config ===================== */
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:10000"
).replace(/\/$/, "");

/* ===================== Types ===================== */
type Education = {
  degree?: string;
  school?: string;
  year?: string | number;
  gpa?: string | number;
};

type WorkItem = {
  title?: string;
  company?: string;
  duration?: string;
  description?: string;
};

type ProjectObj = {
  name?: string;
  description?: string;
  tech?: string[];
};

type Resume = {
  url?: string;
  filename?: string;
  summary?: string;
  education?: Education[];
  workHistory?: WorkItem[];
  projects?: Array<string | ProjectObj>;
  email?: string;
};

type Candidate = {
  resume?: Resume;
};

/* ===================== Helpers ===================== */
const isLong = (txt?: string, limit = 260) => !!txt && txt.length > limit;

/** Normalize resume URL to absolute (backend may return relative path) */
function toAbsoluteUrl(url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${API_BASE}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

/* ===================== Component ===================== */
export default function ResumePreview({ candidate }: { candidate: Candidate }) {
  if (!candidate?.resume) return null;

  const { resume } = candidate;
  const fileName = resume.filename || "Resume.pdf";

  const openUrl = useMemo(() => toAbsoluteUrl(resume.url), [resume.url]);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-card-foreground">Resume Preview</h3>

          {/* Per requirement: open in browser (no refresh/download). */}
          {openUrl ? (
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open resume in browser"
              title="Open resume in browser"
              className="btn btn-primary"
            >
              <i className="ri-external-link-line text-sm" aria-hidden />
              <span className="text-sm">Open</span>
            </a>
          ) : null}
        </div>

        {/* Clickable file tile also opens the resume */}
        <a
          href={openUrl || undefined}
          target={openUrl ? "_blank" : undefined}
          rel={openUrl ? "noopener noreferrer" : undefined}
          className={`block rounded-xl border border-border bg-card/80 backdrop-blur-md p-3 shadow-soft transition ${
            openUrl
              ? "hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              : ""
          }`}
          aria-disabled={!openUrl}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15">
              <i className="ri-file-pdf-line text-lg text-destructive" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {openUrl ? "Opens in a new tab" : "No file URL available"}
              </p>
            </div>
          </div>
        </a>
      </div>

      {/* Professional Summary (show full text; no truncation) */}
      {resume.summary ? (
        <section className="mb-4">
          <h4 className="mb-2 text-base font-semibold text-card-foreground">
            Professional Summary
          </h4>
          <div className="rounded-xl bg-muted/40 p-3 ring-1 ring-inset ring-border">
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {resume.summary}
            </p>
          </div>
        </section>
      ) : null}

      {/* Education */}
      {Array.isArray(resume.education) && resume.education.length > 0 ? (
        <section className="mb-4">
          <h4 className="mb-2 text-base font-semibold text-card-foreground">Education</h4>
          <div className="space-y-2">
            {resume.education.map((edu: Education, index: number) => (
              <div key={index} className="panel p-3 ring-1 ring-border/60">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-medium text-card-foreground">{edu.degree}</h5>
                    <p className="text-sm font-medium text-primary">{edu.school}</p>
                    <p className="text-xs text-muted-foreground">
                      {edu.year ? <>Graduated {edu.year}</> : null}
                    </p>
                  </div>

                  {edu.gpa ? (
                    <div className="text-right">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                        GPA: {edu.gpa}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Work Experience — small heading + details in a box + Read More if long */}
      {Array.isArray(resume.workHistory) && resume.workHistory.length > 0 ? (
        <section className="mb-4">
          <h4 className="mb-2 text-base font-semibold text-card-foreground">Work Experience</h4>
          <div className="space-y-3">
            {resume.workHistory.map((work: WorkItem, index: number) => (
              <WorkItemCard key={index} work={work} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Projects */}
      {Array.isArray(resume.projects) && resume.projects.length > 0 ? (
        <section className="mb-2">
          <h4 className="mb-2 text-base font-semibold text-card-foreground">Key Projects</h4>
          <div className="space-y-3">
            {resume.projects.map((project: string | ProjectObj, index: number) => {
              const isString = typeof project === "string";
              const rawName = isString ? (project as string) : (project as ProjectObj)?.name || "Project";

              const displayName =
                typeof rawName === "string" && rawName.length > 60 ? `${rawName.slice(0, 60)}…` : rawName;

              const desc = isString ? (project as string) : (project as ProjectObj)?.description || "";

              const tech = Array.isArray((project as ProjectObj)?.tech)
                ? ((project as ProjectObj).tech as string[])
                : [];

              return (
                <div key={index} className="panel p-3 ring-1 ring-border/60">
                  <h5 className="mb-1 text-sm font-medium text-card-foreground">{displayName}</h5>

                  {desc ? <p className="mb-2 whitespace-pre-line text-xs text-foreground/80">{desc}</p> : null}

                  {tech.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {tech.map((t: string, i: number) => (
                        <span key={`${t}-${i}`} className="badge">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* NOTE: Per requirements, remove Technical Skills from this page.
               Extracted skills should appear only in the Score & Analysis → Skills Overview section. */}
    </div>
  );
}

/* ===================== Subcomponents ===================== */

function WorkItemCard({ work }: { work: WorkItem }) {
  const [expanded, setExpanded] = useState(false);
  const long = isLong(work.description);

  return (
    <div className="panel p-3 ring-1 ring-border/60">
      {/* Small heading/title */}
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h5 className="text-sm font-medium text-card-foreground">{work.title}</h5>
          <p className="text-sm font-medium text-primary">{work.company}</p>
        </div>
        {work.duration ? (
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground/90 ring-1 ring-inset ring-border">
            {work.duration}
          </span>
        ) : null}
      </div>

      {/* Box with details + Read More toggle if content is long */}
      {work.description ? (
        <div className="relative">
          <div
            className={[
              "whitespace-pre-line text-xs text-foreground/80 transition-all",
              expanded ? "" : "max-h-24 overflow-hidden",
            ].join(" ")}
          >
            {work.description}
          </div>

          {!expanded && long ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-7 h-10 bg-gradient-to-t from-[hsl(var(--card)/.95)] to-transparent" />
          ) : null}

          {long ? (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setExpanded((s) => !s)}
                className="btn btn-outline text-xs px-3 py-1.5"
                aria-expanded={expanded}
              >
                {expanded ? (
                  <>
                    <i className="ri-arrow-up-s-line mr-1" aria-hidden />
                    Show less
                  </>
                ) : (
                  <>
                    <i className="ri-arrow-down-s-line mr-1" aria-hidden />
                    Read more
                  </>
                )}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
