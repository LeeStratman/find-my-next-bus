import AlertsBanner from "@/components/alerts-banner";
import ArrivalsCard from "@/components/arrivals-card";
import HomeSetupCard from "@/components/home-setup-card";
import StopLookup from "@/components/stop-lookup";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-2 text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">
            Madison Metro
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Bus Me Home
          </h1>
          <p className="max-w-2xl text-base text-white/80">
            Save your home stop once, then get real-time arrivals, alerts, and a
            quick path home every day.
          </p>
        </header>

        <AlertsBanner />
        <HomeSetupCard />
        <StopLookup />
        <ArrivalsCard />
      </main>
    </div>
  );
}
