// content/docs.ts
export type DocItem =
  | { type: "text"; text: string }
  | { type: "list"; items: string[] }
  | { type: "image"; src: string; alt?: string; caption?: string }
  | { type: "diagram"; variant?: "architecture" | "pipeline" };

export type DocSection = {
  id: string;
  title: string;
  intro?: string;
  items: DocItem[];
};

export const SECTIONS: DocSection[] = [
  {
    id: "site-flow",
    title: "Site Flow",
    intro:
      "Overview of the primary navigation and how different roles move through SmartHirex.",
    items: [
      {
        type: "text",
        text:
          "Visitors land on marketing pages, sign up, and proceed to upload resumes or explore features. Recruiters manage candidates, tests, and meetings in the app area.",
      },
      {
        type: "list",
        items: [
          "Public: Home → Features → Pricing → Docs → Sign Up",
          "App: Dashboard → Upload → Matching → Tests → Meetings → Analytics",
          "Admin: Team management, billing, and security controls",
        ],
      },
      { type: "image", src: "/web-logo.png", alt: "SmartHirex logo", caption: "Brand mark" },
      { type: "diagram", variant: "pipeline" },
    ],
  },
  {
    id: "resume-processing",
    title: "Resume Processing",
    intro:
      "Bulk CV upload, parsing (OCR + text), normalization, and secure storage.",
    items: [
      {
        type: "list",
        items: [
          "Upload multiple CVs (PDF/DOCX). OCR handles scanned resumes.",
          "Extract entities: name, education, skills, experience, contact.",
          "Normalize and index for fast search and candidate matching.",
        ],
      },
      {
        type: "text",
        text:
          "Parsed data powers semantic matching with job descriptions and downstream analytics.",
      },
    ],
  },
  {
    id: "testing",
    title: "Testing & Assessments",
    intro:
      "Generate role-aware tests from experience claims and validate skills.",
    items: [
      {
        type: "list",
        items: [
          "Auto-create question sets (MCQ/coding/scenario-based).",
          "Grading and reports with skill breakdowns.",
          "Export results and share with stakeholders.",
        ],
      },
    ],
  },
  {
    id: "meetings",
    title: "Meetings & Scheduling",
    intro:
      "Coordinate interviews with calendar integrations and smart time-slot suggestions.",
    items: [
      {
        type: "list",
        items: [
          "One-click scheduling from shortlist.",
          "Google Calendar / Microsoft 365 compatibility.",
          "Automated notifications and rescheduling links.",
        ],
      },
    ],
  },
  {
    id: "dashboards",
    title: "Dashboards & Pipeline",
    intro:
      "Visualize candidate stages, conversion, time-to-hire, and quality scores.",
    items: [
      {
        type: "list",
        items: [
          "Kanban pipeline: New → Shortlisted → Test → Interview → Offer.",
          "Scorecards with matched/missing skills and trends.",
          "Filters for role, location, seniority, and team.",
        ],
      },
      { type: "diagram", variant: "architecture" },
    ],
  },
  {
    id: "auth",
    title: "Authentication & Roles",
    intro:
      "Secure access with role-based permissions for recruiters, hiring managers, and admins.",
    items: [
      {
        type: "list",
        items: [
          "Email/password with modern best practices.",
          "Role-based access control (RBAC) for sensitive actions.",
          "Auditing and export permissions.",
        ],
      },
      { type: "image", src: "/web-logo.png", alt: "Brand" },
    ],
  },
];
