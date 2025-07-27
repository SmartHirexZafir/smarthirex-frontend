import ClientPage from './ClientPage';

export default async function CandidatePage({ params }: { params: { id: string } }) {
  // ✅ Next.js 15 requires async for dynamic params
  const { id } = await Promise.resolve(params); // ensures it's resolved
  return <ClientPage candidateId={id} />;
}
