export default function DocsPage() {
  return (
    <main className="container max-w-5xl py-12 space-y-10">
      <header>
        <h1 className="text-4xl font-extrabold">SmartHireX Documentation</h1>
        <p className="text-muted-foreground mt-2">Overview, modules, and architecture.</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-2xl font-bold">Introduction</h2>
        <p>
          SmartHireX automates resume screening, JD analysis, testing, and interview scheduling with
          fairness-aware scoring and an AI recruiter assistant.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Modules</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Resume Parsing (OCR + parsers)</li>
          <li>JD Analyzer & Semantic Matching</li>
          <li>Categorization & Filtering engine</li>
          <li>Recommendations & Top-K candidates</li>
          <li>Duplicate Detection (similarity/MH)</li>
          <li>AI Chatbot & Skill Gap Analyzer</li>
          <li>Scheduling (Google/Zoom/Teams/Meet)</li>
          <li>Auto Test Generation & Skill Validation</li>
          <li>Bias-Aware Scoring, Pipeline, Export, Feedback</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-2xl font-bold">Architecture (High Level)</h2>
        <p>
          UI → App Logic (Parsing, JD/Matching, Chatbot, Skill Gap, Dedup) → Storage/ML (DB + ML services) → External APIs.
        </p>
      </section>
    </main>
  );
}
