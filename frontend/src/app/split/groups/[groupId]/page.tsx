import { SplitGroupDetailWorkspace } from "@/components/split/split-group-detail-workspace";

type SplitGroupDetailPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function SplitGroupDetailPage({ params }: SplitGroupDetailPageProps) {
  const { groupId } = await params;
  return <SplitGroupDetailWorkspace groupId={groupId} />;
}
