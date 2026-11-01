import React, { useRef, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 72;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      e.preventDefault();
      setPullY(Math.min(delta, THRESHOLD * 1.5));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullY >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    setPullY(0);
    startY.current = null;
  }, [pullY, refreshing, onRefresh]);

  const progress = Math.min(pullY / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none z-10 transition-all"
        style={{ height: `${pullY}px`, overflow: "hidden" }}
      >
        <div
          className="bg-white rounded-full shadow p-2 flex items-center justify-center"
          style={{ opacity: progress, transform: `scale(${0.5 + progress * 0.5})` }}
        >
          <RefreshCw
            className="h-5 w-5 text-blue-500"
            style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none", transform: `rotate(${progress * 360}deg)` }}
          />
        </div>
      </div>

      <div style={{ transform: `translateY(${pullY}px)`, transition: pullY === 0 ? "transform 0.3s ease" : "none" }}>
        {children}
      </div>
    </div>
  );
}