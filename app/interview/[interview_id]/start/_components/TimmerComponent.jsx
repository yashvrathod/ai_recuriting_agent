"use client";
import React, { useEffect, useState } from "react";

export default function TimmerComponent({ start }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!start) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [start]);

  const format = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return <span className="font-semibold">{format(seconds)}</span>;
}
