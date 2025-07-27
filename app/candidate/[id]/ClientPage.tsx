'use client';

import CandidateDetail from './CandidateDetail';

export default function ClientPage({ candidateId }: { candidateId: string }) {
  return <CandidateDetail candidateId={candidateId} />;
}
