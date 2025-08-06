// ✅ File: page.tsx (for route /candidate/[id])
import ClientPage from './ClientPage';

export default async function CandidatePage({ params }: { params: { id: string } }) {
  // ✅ Dynamic route param extraction
  const { id } = await Promise.resolve(params); // no hardcoding
  return <ClientPage candidateId={id} />;
}
