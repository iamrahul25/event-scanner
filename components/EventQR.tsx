"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { FiDownload, FiCopy, FiCheck } from "react-icons/fi";

export function EventQRWidget() {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(window.location.origin + window.location.pathname);
  }, []);

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      // Add some padding to the downloaded image
      const padding = 20;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding);
      }
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "event-qr.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (!url) return null;

  return (
    <div className="flex w-48 flex-col items-start">
      <div className="mb-4">
        <h2 className="text-sm font-bold tracking-tight text-zinc-900">Scan to join</h2>
        <p className="mt-0.5 text-xs font-medium text-zinc-500 leading-relaxed">
          Point your camera here.
        </p>
      </div>
      
      <div ref={qrRef} className="mb-4 rounded-xl bg-white p-3 ring-1 ring-zinc-200">
        <QRCode value={url} size={140} className="rounded-sm" />
      </div>

      <div className="flex w-full gap-2">
        <button
          onClick={handleCopy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white border border-zinc-200 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          {copied ? <FiCheck className="size-3.5 text-emerald-600" /> : <FiCopy className="size-3.5" />}
          <span>{copied ? "Copied" : "Copy Link"}</span>
        </button>
        <button
          onClick={handleDownload}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          <FiDownload className="size-3.5" />
          <span>Save QR</span>
        </button>
      </div>
    </div>
  );
}
