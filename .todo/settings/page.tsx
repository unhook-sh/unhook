import { redirect } from 'next/navigation';

export default async function Page(props: {
  params: Promise<{ orgId: string; projectId: string; envId: string }>;
}) {
  const params = await props.params;
  redirect(
    `/${params.orgId}/${params.projectId}/${params.envId}/settings/billing`,
  );
}
