// smarthirex-frontend-main/content/about.ts
import type { DocSection } from "./docs";

export const ABOUT_SECTIONS: DocSection[] = [
  {
    id: "mission",
    title: "Our Mission",
    items: [
      {
        type: "text",
        text:
          "We help teams hire smarter and faster by turning unstructured candidate signals into clear, actionable insights—without compromising privacy or control.",
      },
      {
        type: "list",
        items: ["Bias-aware", "Candidate-first", "Human-in-the-loop"],
      },
    ],
  },
  {
    id: "how-it-works",
    title: "How it works",
    items: [
      {
        type: "text",
        text:
          "A high-level view of how SmartHirex processes hiring data from intake to decision.",
      },
      {
        type: "diagram",
        variant: "pipeline",
      },
      {
        type: "list",
        items: [
          "Step 1 — Ingest: Import resumes, job reqs, and notes from your ATS or files.",
          "Step 2 — Normalize: Clean, dedupe, and structure data into consistent candidate profiles.",
          "Step 3 — Evaluate: Score skills & experience against role criteria with transparent rationales.",
          "Step 4 — Decide: Collaborate, compare, and move the right candidates forward—confidently.",
        ],
      },
    ],
  },
  {
    id: "security",
    title: "Security & Privacy",
    items: [
      {
        type: "list",
        items: [
          "Data ownership: Your data remains yours. We don't sell or train on your private info.",
          "Encryption: In transit and at rest. Keys are rotated and access is least-privilege.",
          "Compliance ready: Built with auditability to support modern compliance workflows.",
        ],
      },
      {
        type: "list",
        items: ["Role-based access", "Audit logs", "Data residency options"],
      },
    ],
  },
  {
    id: "team-contact",
    title: "Team & Contact",
    items: [
      {
        type: "image",
        src: "/web-logo.png",
        alt: "Team emblem used as placeholder avatar",
        caption: "Product-obsessed team with backgrounds in recruiting, data, and dev tools.",
      },
      {
        type: "list",
        items: [
          "Questions, partnerships, or press: hello@yourcompany.com",
          "Topics: Support · Partnerships · Careers",
        ],
      },
    ],
  },
  {
    id: "faq",
    title: "FAQ",
    items: [
      {
        type: "list",
        items: [
          "Do you integrate with my ATS? We support common import/export flows and are expanding native integrations.",
          "Can I control model usage? Yes—controls allow you to choose providers, limit data retention, and trace outputs.",
          "How do you handle bias? We combine structured criteria, explanations, and reviewer feedback to reduce bias.",
        ],
      },
    ],
  },
  {
    id: "tech",
    title: "Tech at a glance",
    items: [
      {
        type: "text",
        text:
          "A pragmatic stack focused on reliability, speed, and maintainability.",
      },
      {
        type: "list",
        items: [
          "Next.js · TypeScript · Tailwind · shadcn/ui",
          "PostgreSQL · Prisma",
          "Edge caching · CI/CD",
        ],
      },
      {
        type: "list",
        items: [
          "Performance: Static and server-rendered pages optimized for fast first paint.",
          "Observability: Metrics and tracing for reliability and quick incident response.",
          "Scalability: Stateless services, queues where needed, and efficient data access patterns.",
        ],
      },
    ],
  },
  {
    id: "architecture",
    title: "Architecture",
    items: [
      {
        type: "diagram",
        variant: "architecture",
      },
      {
        type: "text",
        text:
          "Ingest → Normalize → Evaluate → Decide, with secure storage and RBAC enforced across services.",
      },
    ],
  },
];

export default ABOUT_SECTIONS;
