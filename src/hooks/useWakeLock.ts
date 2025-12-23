"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
}

export function useWakeLock() {
  const [state, setState] = useState<WakeLockState>({
    isSupported: false,
    isActive: false,
    error: null,
  });

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Check if Wake Lock API is supported
  useEffect(() => {
    const isSupported = "wakeLock" in navigator;
    setState((prev) => ({ ...prev, isSupported }));
  }, []);

  // Request wake lock
  const requestWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator)) {
      setState((prev) => ({
        ...prev,
        error: "Wake Lock API is not supported in this browser",
      }));
      return false;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");

      wakeLockRef.current.addEventListener("release", () => {
        setState((prev) => ({ ...prev, isActive: false }));
      });

      setState((prev) => ({ ...prev, isActive: true, error: null }));
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to request wake lock";
      setState((prev) => ({ ...prev, error: errorMessage, isActive: false }));
      return false;
    }
  }, []);

  // Release wake lock
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setState((prev) => ({ ...prev, isActive: false, error: null }));
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to release wake lock";
        setState((prev) => ({ ...prev, error: errorMessage }));
        return false;
      }
    }
    return true;
  }, []);

  // Toggle wake lock
  const toggleWakeLock = useCallback(async () => {
    if (state.isActive) {
      return releaseWakeLock();
    } else {
      return requestWakeLock();
    }
  }, [state.isActive, requestWakeLock, releaseWakeLock]);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        document.visibilityState === "visible" &&
        state.isActive &&
        !wakeLockRef.current
      ) {
        await requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state.isActive, requestWakeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  return {
    ...state,
    requestWakeLock,
    releaseWakeLock,
    toggleWakeLock,
  };
}
