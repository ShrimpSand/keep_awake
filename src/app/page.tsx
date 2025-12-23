"use client";

import { useEffect } from "react";
import { useWakeLock } from "@/hooks/useWakeLock";

export default function Home() {
  const { isSupported, isActive, error, toggleWakeLock } = useWakeLock();

  useEffect(() => {
    document.title = `${isActive ? "ON" : "OFF"} - Keep Awake`;
  }, [isActive]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <main className="flex flex-col items-center gap-8 p-8">
        <h1 className="text-4xl font-bold text-white">Keep Awake</h1>
        <p className="text-slate-400 text-center max-w-md">
          画面のスリープを防止します。
          <br />
          ボタンをクリックしてON/OFFを切り替えてください。
        </p>

        {!isSupported && (
          <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 px-4 py-3 rounded-lg">
            このブラウザはWake Lock APIをサポートしていません。
            <br />
            Chrome, Edge, または Safari をお試しください。
          </div>
        )}

        <button
          onClick={toggleWakeLock}
          disabled={!isSupported}
          className={`
            relative w-48 h-48 rounded-full transition-all duration-500
            focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-slate-900
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              isActive
                ? "bg-gradient-to-br from-green-400 to-emerald-600 shadow-[0_0_60px_rgba(16,185,129,0.5)] focus:ring-green-500"
                : "bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 focus:ring-slate-500"
            }
          `}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-6xl mb-2">{isActive ? "☀️" : "🌙"}</span>
            <span className="text-xl font-bold text-white">
              {isActive ? "ON" : "OFF"}
            </span>
          </div>

          {isActive && (
            <div className="absolute inset-0 rounded-full animate-ping bg-green-400 opacity-20" />
          )}
        </button>

        <div className="flex flex-col items-center gap-2">
          <div
            className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
            ${
              isActive
                ? "bg-green-500/20 text-green-300"
                : "bg-slate-700 text-slate-400"
            }
          `}
          >
            <span
              className={`w-2 h-2 rounded-full ${isActive ? "bg-green-400 animate-pulse" : "bg-slate-500"}`}
            />
            {isActive ? "スリープ阻害中" : "スリープ許可中"}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg max-w-md text-center">
            エラー: {error}
          </div>
        )}

        <div className="mt-8 text-slate-500 text-sm text-center max-w-md">
          <p>
            このアプリはScreen Wake Lock APIを使用しています。
            <br />
            タブを閉じるか、OFFにすることで通常のスリープ動作に戻ります。
          </p>
        </div>
      </main>
    </div>
  );
}
