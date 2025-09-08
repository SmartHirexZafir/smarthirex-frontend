// content/features.ts
export type Feature = {
  id: string;
  title: string;
  description: string;
  icon: string; // remix icon class, e.g., "ri-brain-line"
  tone: "info" | "accent" | "success" | "warning" | "secondary" | "primary";
  label: string; // small pill/label text
  tags: string[]; // taxonomy for filtering/search
  href?: string; // optional deep link (e.g., /docs#anchor)
};

export const FEATURES: Feature[] = [
  {
    id: "ai-resume-screening",
    title: "AI Resume Screening",
    description:
      "Instantly analyze large volumes of resumes and surface the best candidates with high accuracy.",
    icon: "ri-brain-line",
    tone: "info",
    label: "AI Screening",
    tags: ["ai", "screening", "nlp", "ranking"],
    href: "/docs#ai-screening",
  },
  {
    id: "candidate-matching",
    title: "Smart Candidate Matching",
    description:
      "Match candidates to roles using context-aware algorithms that understand skills and experience.",
    icon: "ri-user-search-line",
    tone: "accent",
    label: "Matching",
    tags: ["matching", "search", "semantic", "context"],
    href: "/docs#smart-matching",
  },
  {
    id: "interview-scheduling",
    title: "Automated Interview Scheduling",
    description:
      "Coordinate interviews effortlessly with calendar integration and AI-driven time slot optimization.",
    icon: "ri-calendar-check-line",
    tone: "success",
    label: "Scheduling",
    tags: ["calendar", "scheduling", "automation", "meetings"],
    href: "/docs#interview-scheduling",
  },
  {
    id: "test-generation",
    title: "Intelligent Test Generation",
    description:
      "Create tailored skills assessments and coding challenges for any role in seconds.",
    icon: "ri-code-s-slash-line",
    tone: "warning",
    label: "Assessments",
    tags: ["assessments", "coding tests", "skills", "generator"],
    href: "/docs#test-generation",
  },
  {
    id: "analytics",
    title: "Real-time Analytics",
    description:
      "Monitor your pipeline with dashboards that track conversion, time-to-hire, and quality.",
    icon: "ri-bar-chart-box-line",
    tone: "secondary",
    label: "Analytics",
    tags: ["dashboards", "metrics", "reporting", "insights"],
    href: "/docs#analytics",
  },
  {
    id: "resume-processing",
    title: "Lightning-Fast Resume Processing",
    description:
      "Parse thousands of resumes per minute with accurate entity extraction and normalization.",
    icon: "ri-upload-cloud-2-line",
    tone: "info",
    label: "Parsing",
    tags: ["parsing", "ocr", "etl", "normalization"],
    href: "/docs#resume-processing",
  },
  {
    id: "neural-matching",
    title: "Neural Matching Algorithm",
    description:
      "Goes beyond keywords to evaluate context and potential using learned patterns.",
    icon: "ri-cpu-line",
    tone: "primary",
    label: "Neural",
    tags: ["neural", "ml", "ranking", "context"],
    href: "/docs#neural-matching",
  },
  {
    id: "predictive-scoring",
    title: "Predictive Scoring Engine",
    description:
      "Holistic scores across 15+ factors — skills, experience, culture fit, and success probability.",
    icon: "ri-line-chart-line",
    tone: "success",
    label: "Scoring",
    tags: ["scoring", "prediction", "quality", "fit"],
    href: "/docs#predictive-scoring",
  },
  {
    id: "verification-suite",
    title: "Advanced Verification Suite",
    description:
      "Verify credentials, employment history, and references with trusted data sources.",
    icon: "ri-shield-check-line",
    tone: "secondary",
    label: "Verification",
    tags: ["verification", "background", "compliance", "trust"],
    href: "/docs#verification",
  },
  {
    id: "collab-hub",
    title: "Collaborative Decision Hub",
    description:
      "Centralize discussions with shared profiles, comments, and structured evaluations.",
    icon: "ri-team-line",
    tone: "primary",
    label: "Collaboration",
    tags: ["collaboration", "reviews", "workflow", "teams"],
    href: "/docs#collaboration",
  },
];
