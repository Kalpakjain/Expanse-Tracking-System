import { redirect } from "next/navigation";

type GroupsDetailRedirectPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupsDetailRedirectPage({ params }: GroupsDetailRedirectPageProps) {
  const { groupId } = await params;
  redirect(`/split/groups/${groupId}`);
}
