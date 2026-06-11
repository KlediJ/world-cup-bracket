"use client";

import { useMemo, useState } from "react";

type ShareSubmissionControlsProps = {
  playerName: string;
  championName: string;
};

export function ShareSubmissionControls({ playerName, championName }: ShareSubmissionControlsProps) {
  const [message, setMessage] = useState("");
  const shareTitle = `${playerName}'s World Cup bracket`;
  const shareText = `${playerName} picked ${championName} to win the World Cup.`;
  const canUseNativeShare = typeof navigator !== "undefined" && "share" in navigator;
  const currentUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.location.href;
  }, []);

  async function copyLink() {
    if (!currentUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(currentUrl);
      setMessage("Link copied.");
    } catch {
      setMessage("Could not copy link.");
    }
  }

  async function shareLink() {
    if (!canUseNativeShare || !currentUrl) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: currentUrl,
      });
      setMessage("Share sheet opened.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setMessage("Could not open share sheet.");
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={copyLink} className="min-h-11 rounded-md bg-zinc-950 px-4 py-3 text-sm font-black text-white transition hover:bg-zinc-800">
          Copy Link
        </button>
        <button type="button" onClick={shareLink} className="min-h-11 rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm font-black text-zinc-800 transition hover:border-emerald-600 hover:text-emerald-700">
          Share
        </button>
      </div>
      {message ? <p className="text-sm font-black text-emerald-700">{message}</p> : null}
    </div>
  );
}
