"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
}

export function useWakeLock() {
  const [state, setState] = useState<WakeLockState>({
    isSupported: false, // Will be updated on client
    isActive: false,
    error: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Check PiP support on client side only
  useEffect(() => {
    const supported = "pictureInPictureEnabled" in document;
    setState((prev) => ({ ...prev, isSupported: supported }));
  }, []);

  // Create minimal video stream from canvas
  const createVideoStream = useCallback(() => {
    // Create tiny canvas (smallest practical size)
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;
    canvasRef.current = canvas;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Draw minimal content (just a dot that changes slightly to keep stream active)
    let frame = 0;
    const draw = () => {
      // Alternate between two very similar colors to keep the stream "active"
      const shade = frame % 2 === 0 ? 30 : 31;
      ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
      ctx.fillRect(0, 0, 2, 2);
      frame++;
      animationRef.current = requestAnimationFrame(draw);
    };
    draw();

    // Create video element
    const video = document.createElement("video");
    video.srcObject = canvas.captureStream(1); // 1 FPS for minimal resource usage
    video.muted = true;
    video.playsInline = true;
    video.style.position = "fixed";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    video.style.width = "1px";
    video.style.height = "1px";
    document.body.appendChild(video);

    return video;
  }, []);

  // Start PiP
  const requestWakeLock = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: "このブラウザはPicture-in-Pictureをサポートしていません",
      }));
      return false;
    }

    try {
      // Create video if not exists
      if (!videoRef.current) {
        const video = createVideoStream();
        if (!video) {
          setState((prev) => ({ ...prev, error: "動画ストリームの作成に失敗しました" }));
          return false;
        }
        videoRef.current = video;
      }

      // Play video (required before PiP)
      await videoRef.current.play();

      // Request PiP
      await videoRef.current.requestPictureInPicture();

      // Listen for PiP exit
      videoRef.current.addEventListener("leavepictureinpicture", () => {
        setState((prev) => ({ ...prev, isActive: false }));
      });

      setState((prev) => ({ ...prev, isActive: true, error: null }));
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "PiPの開始に失敗しました";
      setState((prev) => ({ ...prev, isActive: false, error: errorMessage }));
      return false;
    }
  }, [state.isSupported, createVideoStream]);

  // Stop PiP
  const releaseWakeLock = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      }

      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.remove();
        videoRef.current = null;
      }

      if (canvasRef.current) {
        canvasRef.current = null;
      }

      setState((prev) => ({ ...prev, isActive: false, error: null }));
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "PiPの終了に失敗しました";
      setState((prev) => ({ ...prev, isActive: false, error: errorMessage }));
      return false;
    }
  }, []);

  // Toggle
  const toggleWakeLock = useCallback(async () => {
    if (state.isActive) {
      return releaseWakeLock();
    } else {
      return requestWakeLock();
    }
  }, [state.isActive, requestWakeLock, releaseWakeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.remove();
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
