// app/candidate/[id]/ResumePreview.tsx
"use client";

import React from "react";

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
  skills?: string[];
  matchedSkills?: string[];
};

/* ===================== Component ===================== */
export default function ResumePreview({ candidate }: { candidate: Candidate }) {
  if (!candidate?.resume) return null;

  const { resume } = candidate;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-card-foreground">Resume Preview</h3>

          {resume.url ? (
            <a
              href={resume.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download resume"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-primary-foreground shadow-soft transition-all hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <i className="ri-download-line text-sm" aria-hidden />
              <span className="text-sm">Download</span>
            </a>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-md p-3 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15">
              <i className="ri-file-pdf-line text-lg text-destructive" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground">
                {resume.filename || "Resume.pdf"}
              </p>
              <p className="text-xs text-muted-foreground">Uploaded via system</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      {resume.summary ? (
        <section className="mb-4">
          <h4 className="mb-2 text-base font-semibold text-card-foreground">
            Professional Summary
          </h4>
          <p className="whitespace-pre-line rounded-xl bg-muted/40 p-3 text-sm leading-relaxed text-foreground/90 ring-1 ring-inset ring-border">
            {resume.summary}
          </p>
        </section>
      ) : null}

      {/* Education */}
      {Array.isArray(resume.education) && resume.education.length > 0 ? (
        <section className="mb-4">
          <h4 className="mb-2 text-base font-semibold text-card-foreground">Education</h4>
          <div className="space-y-2">
            {resume.education.map((edu: Education, index: number) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-card/70 p-3 backdrop-blur-md shadow-soft"
              >
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

      {/* Work Experience */}
      {Array.isArray(resume.workHistory) && resume.workHistory.length > 0 ? (
        <section className="mb-4">
          <h4 className="mb-2 text-base font-semibold text-card-foreground">Work Experience</h4>
          <div className="space-y-3">
            {resume.workHistory.map((work: WorkItem, index: number) => (
              <div
                key={index}
                className="rounded-r-xl border-l-4 border-primary bg-card/60 pl-3 py-2 backdrop-blur-md shadow-soft ring-1 ring-border"
              >
                <div className="mb-1 flex items-start justify-between">
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

                {work.description ? (
                  <p className="whitespace-pre-line text-xs text-foreground/80">
                    {work.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Projects */}
      {Array.isArray(resume.projects) && resume.projects.length > 0 ? (
        <section className="mb-4">
          <h4 className="mb-2 text-base font-semibold text-card-foreground">Key Projects</h4>
          <div className="space-y-3">
            {resume.projects.map((project: string | ProjectObj, index: number) => {
              const isString = typeof project === "string";
              const rawName = isString
                ? (project as string)
                : (project as ProjectObj)?.name || "Project";

              const displayName =
                typeof rawName === "string" && rawName.length > 40
                  ? `${rawName.slice(0, 40)}…`
                  : rawName;

              const desc = isString
                ? (project as string)
                : (project as ProjectObj)?.description || "";

              const tech = Array.isArray((project as ProjectObj)?.tech)
                ? ((project as ProjectObj).tech as string[])
                : [];

              return (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-card/70 p-3 backdrop-blur-md shadow-soft"
                >
                  <h5 className="mb-1 text-sm font-medium text-card-foreground">{displayName}</h5>

                  {desc ? (
                    <p className="mb-2 whitespace-pre-line text-xs text-foreground/80">{desc}</p>
                  ) : null}

                  {tech.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {tech.map((t: string, i: number) => (
                        <span
                          key={`${t}-${i}`}
                          className="rounded-full bg-secondary/15 px-2 py-1 text-xs font-medium text-secondary ring-1 ring-inset ring-secondary/25"
                        >
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

      {/* Skills */}
      {Array.isArray(candidate.skills) && candidate.skills.length > 0 ? (
        <section>
          <h4 className="mb-2 text-base font-semibold text-card-foreground">Technical Skills</h4>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.map((skill: string, index: number) => {
              const matched =
                Array.isArray(candidate.matchedSkills) &&
                candidate.matchedSkills.includes(skill);

              return (
                <span
                  key={`${skill}-${index}`}
                  className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    matched
                      ? "bg-success/15 text-success ring-success/30"
                      : "bg-muted text-foreground/80 ring-border"
                  }`}
                >
                  {skill}
                  {matched && <i className="ri-check-line ml-1" aria-hidden />}
                </span>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
