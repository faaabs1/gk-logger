"use client";
import { useState, useEffect, useRef } from "react";

export default function Stopwatch({ time, running, onTick }) {
  const [seconds, setSeconds] = useState(time);
  const intervalRef = useRef(null);
  const onTickRef = useRef(onTick);
  const secondsRef = useRef(time);

  // Update onTick ref without causing effect to recreate
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  // Sync time from parent
  useEffect(() => {
    setSeconds(time);
    secondsRef.current = time;
  }, [time]);

  // Interval - only update seconds, don't call onTick here
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [running]);

  // Separate effect to handle onTick side effect
  useEffect(() => {
    if (onTickRef.current) {
      onTickRef.current(seconds);
    }
  }, [seconds]);

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