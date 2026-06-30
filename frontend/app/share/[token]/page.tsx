import { SharedProjectView } from "./shared-view";

export const dynamic = "force-dynamic";

export default function SharePage({ params }: { params: { token: string } }) {
  return <SharedProjectView token={params.token} />;
}
