"use client";
import { useCallback, useEffect, useState } from "react";

const EVT = "continued-store";

/** localStorage-backed state. Returns [value, set, ready]; `ready` is false until hydrated. */
export function useStored<T>(key: string, initial: T | (() => T)): [T, (v: T | ((p: T) => T)) => void, boolean] {
  const init = () => (typeof initial === "function" ? (initial as () => T)() : initial);
  const [val, setVal] = useState<T>(init);
  const [ready, setReady] = useState(false);

  const load = useCallback((): T => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : init();
    } catch {
      return init();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    setVal(load());
    setReady(true);
    const h = (e: Event) => {
      if ((e as CustomEvent).detail === key) setVal(load());
    };
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, [key, load]);

  const set = useCallback(
    (v: T | ((p: T) => T)) => {
      const next = typeof v === "function" ? (v as (p: T) => T)(load()) : v;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      setVal(next);
      window.dispatchEvent(new CustomEvent(EVT, { detail: key }));
    },
    [key, load]
  );

  return [val, set, ready];
}
