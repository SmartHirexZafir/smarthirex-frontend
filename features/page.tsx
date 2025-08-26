export default function FeaturesPage() {
  return (
    <main className="container max-w-5xl py-12 space-y-12">
      <header>
        <h1 className="text-4xl font-extrabold">Features</h1>
        <p className="text-muted-foreground mt-2">
          Everything SmartHireX offers to make hiring faster, fairer, and smarter.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Core</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          <li><strong>Bulk CV Upload & Parsing:</strong> PDF/DOCX + OCR, extract structured data.</li>
          <li><strong>Job Description Analyzer:</strong> Extract skills/experience; semantic vectors.</li>
          <li><strong>Intelligent Matching:</strong> Score 0–100 with matched/missing skills.</li>
          <li><strong>Resume Classification:</strong> Auto role categorization.</li>
          <li><strong>Advanced Filtering:</strong> Education, years, skills, tools/tech.</li>
          <li><strong>Top Candidate Suggestions:</strong> Shortlists with highlights.</li>
        </ul>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Automation</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          <li><strong>Scheduling:</strong> Google/Zoom/Teams/Meet.</li>
          <li><strong>Auto Test Generation:</strong> MCQs/coding/scenario tests.</li>
          <li><strong>AI Skill Validation:</strong> Cross-check claims with past projects.</li>
          <li><strong>Bias-aware Scoring:</strong> Blind review options.</li>
          <li><strong>AI Recruiter Assistant:</strong> Natural-language candidate queries.</li>
          <li><strong>Duplicate Detection:</strong> Similarity & fingerprinting.</li>
        </ul>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Workflow</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          <li><strong>Pipeline Tracking:</strong> New → Shortlisted → Test → Interview → Offer/Rejected.</li>
          <li><strong>Export & Sharing:</strong> PDF/Excel exports; share shortlists.</li>
          <li><strong>Interview Feedback:</strong> Notes & skill ratings per candidate.</li>
        </ul>
      </section>
    </main>
  );
}
