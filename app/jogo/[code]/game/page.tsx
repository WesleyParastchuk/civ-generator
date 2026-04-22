import { GamePage } from "./GamePage";

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <div className="relative isolate flex min-h-[100dvh] flex-col overflow-x-clip">
      <div className="page-ornament" aria-hidden />
      <div className="grain-overlay" aria-hidden />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-7 sm:px-6 sm:py-8 lg:px-12 lg:py-10">
        <GamePage code={code} />
      </main>
    </div>
  );
}
