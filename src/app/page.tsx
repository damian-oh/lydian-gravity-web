import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-24">
      <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
        Lydian Gravity
      </h1>
      <p className="mt-4 text-lg text-slate-400">
        Bridging the gap between George Russell and the modern web.
      </p>
      <div className="mt-8 p-4 border border-slate-700 rounded-lg bg-slate-800/50">
        <p className="font-mono text-sm">Status: Connected to Next.js 2026</p>
      </div>
    </main>
  );
}
