import SmartScoutChat from '../components/SmartScoutChat'

export default function AIScopePage({
  searchParams,
}: {
  searchParams: Promise<{ analysisId?: string }>
}) {
  return <SmartScoutChat searchParams={searchParams} />
}
