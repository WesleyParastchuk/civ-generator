import { DevGamePage } from "./DevGamePage";

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <div className="relative isolate flex h-[100dvh] w-full flex-col overflow-hidden">
      <div className="grain-overlay" aria-hidden />
      <DevGamePage code={code} />
    </div>
  );
}
