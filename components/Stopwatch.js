"use client";
import { useState, useEffect, useRef } from "react";

export default function Stopwatch({ time, running, onTick }) {
  const [seconds, setSeconds] = useState(time);
  const intervalRef = useRef(null);

  // Sync time from parent
  useEffect(() => {
    setSeconds(time);
  }, [time]);

  // Interval
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          const newTime = prev + 1;
          if (onTick) onTick(newTime);
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [running, onTick]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="text-4xl font-mono text-center p-4 bg-gray-800 rounded">
      {formatTime(seconds)}
    </div>
  );
}