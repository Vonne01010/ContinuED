"use client";
import type { Pkg } from "./types";

/**
 * Real device-to-device sharing over a WebRTC data channel.
 * No server and no internet: peers exchange a connection code (copy/paste, or automatically
 * between tabs of the same browser) and then the package travels directly between them.
 * With no STUN/TURN servers only local network (same Wi-Fi, hotspot or same machine) candidates are used.
 */
export type P2PEvent =
  | { type: "status"; text: string }
  | { type: "connected" }
  | { type: "progress"; pct: number }
  | { type: "sent" }
  | { type: "received"; pkg: Pkg }
  | { type: "error"; text: string };

const CHUNK = 12000;
const rtcConfig: RTCConfiguration = { iceServers: [] };

const encode = (d: RTCSessionDescriptionInit | null) => btoa(JSON.stringify({ type: d?.type, sdp: d?.sdp }));
function decode(code: string): RTCSessionDescriptionInit {
  const d = JSON.parse(atob(code.trim()));
  if (!d?.type || !d?.sdp) throw new Error("That code is not valid");
  return d;
}

function gathered(pc: RTCPeerConnection): Promise<void> {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") return resolve();
    const done = () => {
      pc.removeEventListener("icegatheringstatechange", check);
      resolve();
    };
    const check = () => pc.iceGatheringState === "complete" && done();
    pc.addEventListener("icegatheringstatechange", check);
    setTimeout(done, 3000); // do not wait forever
  });
}

export function validPackage(p: unknown): p is Pkg {
  const o = p as Pkg;
  return !!o && typeof o.id === "string" && typeof o.version === "string" && Array.isArray(o.items) && o.items.length > 0 && o.items.length <= 60 && o.items.every((i) => typeof i?.lesson === "string" && typeof i?.title === "string");
}

export class P2PSender {
  private pc = new RTCPeerConnection(rtcConfig);
  private dc = this.pc.createDataChannel("package");
  constructor(private pkg: Pkg, private emit: (e: P2PEvent) => void) {
    this.dc.onopen = () => {
      emit({ type: "connected" });
      void this.send();
    };
    this.dc.onmessage = (m) => {
      if (m.data === "ack") emit({ type: "sent" });
      if (typeof m.data === "string" && m.data.startsWith("err:")) emit({ type: "error", text: m.data.slice(4) });
    };
    this.pc.onconnectionstatechange = () => {
      if (this.pc.connectionState === "failed") emit({ type: "error", text: "Could not connect. Are both devices on the same Wi-Fi or hotspot?" });
    };
  }

  async createOffer(): Promise<string> {
    this.emit({ type: "status", text: "Preparing a connection code…" });
    await this.pc.setLocalDescription(await this.pc.createOffer());
    await gathered(this.pc);
    return encode(this.pc.localDescription);
  }

  async acceptAnswer(code: string) {
    if (this.pc.signalingState !== "have-local-offer") return;
    this.emit({ type: "status", text: "Connecting…" });
    await this.pc.setRemoteDescription(decode(code));
  }

  private async send() {
    const json = JSON.stringify(this.pkg);
    const n = Math.ceil(json.length / CHUNK);
    this.dc.send(JSON.stringify({ t: "meta", n, bytes: json.length }));
    for (let i = 0; i < n; i++) {
      while (this.dc.bufferedAmount > 512_000) await new Promise((r) => setTimeout(r, 20));
      this.dc.send(JSON.stringify({ t: "c", i, d: json.slice(i * CHUNK, (i + 1) * CHUNK) }));
      this.emit({ type: "progress", pct: Math.round(((i + 1) / n) * 100) });
    }
    this.dc.send(JSON.stringify({ t: "end" }));
  }

  close() {
    this.dc.close();
    this.pc.close();
  }
}

export class P2PReceiver {
  private pc = new RTCPeerConnection(rtcConfig);
  private parts: string[] = [];
  private total = 0;
  constructor(private emit: (e: P2PEvent) => void) {
    this.pc.ondatachannel = (ev) => {
      const dc = ev.channel;
      emit({ type: "connected" });
      dc.onmessage = (m) => {
        try {
          const msg = JSON.parse(m.data as string);
          if (msg.t === "meta") {
            this.total = msg.n;
            this.parts = [];
          } else if (msg.t === "c") {
            this.parts[msg.i] = msg.d;
            emit({ type: "progress", pct: Math.round((this.parts.filter(Boolean).length / this.total) * 100) });
          } else if (msg.t === "end") {
            const pkg = JSON.parse(this.parts.join(""));
            if (!validPackage(pkg)) throw new Error("The package was not valid");
            emit({ type: "received", pkg });
            dc.send("ack");
          }
        } catch (e) {
          const text = e instanceof Error ? e.message : "Transfer failed";
          dc.send(`err:${text}`);
          emit({ type: "error", text });
        }
      };
    };
    this.pc.onconnectionstatechange = () => {
      if (this.pc.connectionState === "failed") emit({ type: "error", text: "Could not connect. Are both devices on the same Wi-Fi or hotspot?" });
    };
  }

  /** Takes the sender's code and returns the answer code to send back. */
  async acceptOffer(code: string): Promise<string> {
    this.emit({ type: "status", text: "Preparing a reply code…" });
    await this.pc.setRemoteDescription(decode(code));
    await this.pc.setLocalDescription(await this.pc.createAnswer());
    await gathered(this.pc);
    return encode(this.pc.localDescription);
  }

  close() {
    this.pc.close();
  }
}
