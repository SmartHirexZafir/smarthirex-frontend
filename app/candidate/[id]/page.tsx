import CandidateDetail from './CandidateDetail';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' },
    { id: '7' },
    { id: '8' },
    { id: '9' },
  ];
}

export default function CandidatePage({ params }: { params: { id: string } }) {
  return <CandidateDetail candidateId={params.id} />;
}