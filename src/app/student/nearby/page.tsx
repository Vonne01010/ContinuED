"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, Card, ProgressBar } from "@/components/ui";
import { PageHeader, Tip } from "@/components/extras";
import { P2PReceiver, P2PSender, type P2PEvent } from "@/lib/p2p";
import { lsGet, lsSet } from "@/lib/useStored";
import { usePackage, useStudent } from "@/lib/useStudent";
import type { Pkg } from "@/lib/types";

type Mode = "share" | "receive";
type Msg = { t: "offer" | "answer"; id: string; code: string };

export default function Nearby() {
  const { pkg } = usePackage();
  const { addBadge } = useStudent();
  const [mode, setMode] = useState<Mode>("share");
  const [status, setStatus] = useState("Ready.");
  const [pct, setPct] = useState(0);
  const [connected, setConnected] = useState(false);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const [myCode, setMyCode] = useState("");
  const [theirCode, setTheirCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);

  const sender = useRef<P2PSender | null>(null);
  const receiver = useRef<P2PReceiver | null>(null);
  const bc = useRef<BroadcastChannel | null>(null);
  const sessionId = useRef("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSupported(typeof RTCPeerConnection !== "undefined");
    return reset;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reset() {
    if (timer.current) clearInterval(timer.current);
    sender.current?.close();
    receiver.current?.close();
    bc.current?.close();
    sender.current = receiver.current = bc.current = null;
  }

  function onEvent(e: P2PEvent) {
    if (e.type === "status") setStatus(e.text);
    if (e.type === "connected") {
      setConnected(true);
      setStatus("Connected. Transferring…");
      if (timer.current) clearInterval(timer.current);
    }
    if (e.type === "progress") setPct(e.pct);
    if (e.type === "sent") {
      addBadge("Good Neighbor");
      setDone(`Shared v${pkg.version} (${pkg.items.length} lessons) with a nearby device.`);
      setStatus("Done");
    }
    if (e.type === "received") {
      const local = lsGet<Pkg | null>("continued.currentPackage", null);
      lsSet("continued.currentPackage", e.pkg);
      addBadge("Good Neighbor");
      setDone(`Received package v${e.pkg.version} with ${e.pkg.items.length} lessons${local && local.id === e.pkg.id ? " (you already had it)" : ""}. It is saved on this device.`);
      setStatus("Done");
    }
    if (e.type === "error") {
      setError(e.text);
      setBusy(false);
    }
  }

  function fresh(m: Mode) {
    reset();
    setMode(m);
    setStatus("Ready.");
    setPct(0);
    setConnected(false);
    setDone("");
    setError("");
    setMyCode("");
    setTheirCode("");
    setBusy(false);
  }

  async function startSharing() {
    reset();
    setError("");
    setDone("");
    setBusy(true);
    try {
      const s = new P2PSender(pkg, onEvent);
      sender.current = s;
      const code = await s.createOffer();
      setMyCode(code);
      setStatus("Waiting for a nearby device…");
      // Same-browser tabs find each other automatically; other devices use the code.
      const id = `${Date.now()}`;
      sessionId.current = id;
      const channel = new BroadcastChannel("continued-p2p");
      bc.current = channel;
      channel.onmessage = (ev: MessageEvent<Msg>) => {
        if (ev.data.t === "answer" && ev.data.id === id) void s.acceptAnswer(ev.data.code).catch((e) => onEvent({ type: "error", text: String(e.message ?? e) }));
      };
      const post = () => channel.postMessage({ t: "offer", id, code } satisfies Msg);
      post();
      timer.current = setInterval(post, 2000);
    } catch (e) {
      onEvent({ type: "error", text: e instanceof Error ? e.message : "Could not start sharing" });
    }
  }

  async function connectWithAnswer() {
    try {
      await sender.current?.acceptAnswer(theirCode);
    } catch (e) {
      onEvent({ type: "error", text: e instanceof Error ? e.message : "That code did not work" });
    }
  }

  async function replyTo(code: string, id?: string) {
    if (receiver.current) return; // already handling one sender
    setError("");
    try {
      const r = new P2PReceiver(onEvent);
      receiver.current = r;
      const answer = await r.acceptOffer(code);
      setMyCode(answer);
      setStatus("Reply ready. Waiting for the sender to connect…");
      if (id) bc.current?.postMessage({ t: "answer", id, code: answer } satisfies Msg);
    } catch (e) {
      receiver.current?.close();
      receiver.current = null;
      onEvent({ type: "error", text: e instanceof Error ? e.message : "That code did not work" });
    }
  }

  function startListening() {
    reset();
    setError("");
    setDone("");
    setBusy(true);
    setStatus("Looking for a nearby sender…");
    const channel = new BroadcastChannel("continued-p2p");
    bc.current = channel;
    channel.onmessage = (ev: MessageEvent<Msg>) => {
      if (ev.data.t === "offer") void replyTo(ev.data.code, ev.data.id);
    };
  }

  const copy = (t: string) => navigator.clipboard?.writeText(t).catch(() => {});

  return (
    <div className="stagger mx-auto max-w-3xl space-y-6">
      <PageHeader icon="📡" title="Nearby" subtitle="Share lessons phone-to-phone, no internet needed." />

      <Tip icon="📶">
        Both devices need this app open and be on the <b>same Wi-Fi or phone hotspot</b>. Lessons travel straight from one device to the other. Open the app online once beforehand so it is saved for offline use.
      </Tip>

      {!supported && <div className="rounded-2xl bg-danger/10 p-4 text-sm font-bold text-danger" role="alert">This browser does not support device-to-device sharing (WebRTC).</div>}

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-mist p-1" role="tablist">
        {(["share", "receive"] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => fresh(m)} className={`rounded-xl py-2.5 text-sm font-extrabold transition ${mode === m ? "bg-white text-navy shadow-soft" : "text-slate-500"}`}>
            {m === "share" ? "📤 Share my lessons" : "📥 Get lessons"}
          </button>
        ))}
      </div>

      <Card className="space-y-4">
        {mode === "share" ? (
          <>
            <div>
              <h2 className="text-lg font-extrabold">Share package v{pkg.version}</h2>
              <p className="text-sm text-slate-500">{pkg.items.length} lessons · {pkg.sizeMB} MB. A classmate nearby can get it from you.</p>
            </div>
            {!myCode ? (
              <Button onClick={startSharing} disabled={busy || !supported}>{busy ? "Preparing…" : "Start sharing"}</Button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-bold" htmlFor="mycode">Your sharing code</label>
                  <textarea id="mycode" readOnly value={myCode} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 bg-mist/60 p-2 font-mono text-[11px]" />
                  <Button variant="secondary" className="mt-1 !py-1.5 text-xs" onClick={() => copy(myCode)}>Copy code</Button>
                  <p className="mt-1 text-xs text-slate-500">Tabs of this browser connect automatically. For another device, send this code to it, then paste its reply below.</p>
                </div>
                <div>
                  <label className="text-sm font-bold" htmlFor="reply">Reply code from the other device</label>
                  <textarea id="reply" value={theirCode} onChange={(e) => setTheirCode(e.target.value)} rows={3} placeholder="Paste the reply code here" className="mt-1 w-full rounded-xl border border-slate-200 p-2 font-mono text-[11px] focus:border-blue focus:outline-none" />
                  <Button className="mt-1" onClick={connectWithAnswer} disabled={!theirCode.trim() || connected}>Connect and send</Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-extrabold">Get lessons from a nearby device</h2>
              <p className="text-sm text-slate-500">Ask a classmate or teacher to open Nearby and tap Start sharing.</p>
            </div>
            <Button onClick={startListening} disabled={busy || !supported}>{busy ? "Listening…" : "🔍 Look for a nearby sender"}</Button>
            <div>
              <label className="text-sm font-bold" htmlFor="offer">Or paste their sharing code</label>
              <textarea id="offer" value={theirCode} onChange={(e) => setTheirCode(e.target.value)} rows={3} placeholder="Paste the sharing code here" className="mt-1 w-full rounded-xl border border-slate-200 p-2 font-mono text-[11px] focus:border-blue focus:outline-none" />
              <Button variant="secondary" className="mt-1" onClick={() => void replyTo(theirCode.trim())} disabled={!theirCode.trim() || !!receiver.current}>Create reply code</Button>
            </div>
            {myCode && (
              <div>
                <label className="text-sm font-bold" htmlFor="answer">Your reply code (send this back to the sender)</label>
                <textarea id="answer" readOnly value={myCode} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 bg-mist/60 p-2 font-mono text-[11px]" />
                <Button variant="secondary" className="mt-1 !py-1.5 text-xs" onClick={() => copy(myCode)}>Copy code</Button>
              </div>
            )}
          </>
        )}

        <div className="space-y-2 rounded-2xl bg-mist/60 p-3" role="status">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>{connected ? "🟢 " : "⚪ "}{status}</span>
            {pct > 0 && <span>{pct}%</span>}
          </div>
          {pct > 0 && <ProgressBar value={pct} color={pct >= 100 ? "green" : "blue"} label="Transfer progress" />}
        </div>

        {done && (
          <div className="pop rounded-2xl border border-green/30 bg-green/10 p-4 text-sm font-bold text-green">
            ✓ {done}{" "}
            {mode === "receive" && <Link href="/student/my-learning" className="underline">Open My Learning →</Link>}
          </div>
        )}
        {error && <div className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm font-semibold text-danger" role="alert">{error}</div>}
      </Card>
    </div>
  );
}
