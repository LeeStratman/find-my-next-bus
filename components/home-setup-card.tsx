"use client";

import { useHomeStop } from "@/hooks/use-home-stop";
import { getStopById } from "@/lib/bustime";
import { useMutation } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

export default function HomeSetupCard() {
  const { homeStop, setHomeStop, clearHomeStop } = useHomeStop();
  const [input, setInput] = useState("");

  const mutation = useMutation({
    mutationFn: async (stopId: string) => {
      const stop = await getStopById(stopId);
      return stop;
    },
    onSuccess: (stop) => {
      setHomeStop({
        stpid: stop.stpid,
        stpnm: stop.stpnm,
        lat: stop.lat,
        lon: stop.lon,
      });
      setInput("");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;
    mutation.mutate(value);
  };

  if (homeStop) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-lg backdrop-blur">
        <p className="text-sm uppercase tracking-wide text-white/70">Home</p>
        <h2 className="mt-2 text-2xl font-semibold">{homeStop.stpnm}</h2>
        <p className="text-sm text-white/70">Stop #{homeStop.stpid}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium transition hover:border-white hover:text-white"
            onClick={() => clearHomeStop()}
          >
            Change stop
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-white shadow-lg backdrop-blur">
      <h2 className="text-2xl font-semibold">Where do you catch the bus?</h2>
      <p className="mt-2 text-sm text-white/80">
        Enter the Madison Metro stop ID closest to your home. We&apos;ll
        remember it on this device.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="home-stop-input">
          Stop ID
        </label>
        <input
          id="home-stop-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="e.g. 1234"
          className="flex-1 rounded-full border border-white/40 bg-transparent px-4 py-2 text-base text-white outline-none ring-2 ring-transparent transition focus:ring-white"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={mutation.isPending}
        />
        <button
          type="submit"
          className="rounded-full bg-white px-5 py-2 text-base font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={mutation.isPending}
        >
          Save home stop
        </button>
      </form>
      {mutation.isError && (
        <p className="mt-3 text-sm text-rose-200">
          {(mutation.error as Error).message || "Unable to find that stop."}
        </p>
      )}
      {mutation.isPending && (
        <p className="mt-3 text-sm text-white/80">Looking up that stop…</p>
      )}
    </section>
  );
}

