// app/test/Components/CountdownTimer.tsx
"use client";

import React, { useState, useEffect } from "react";

type Props = {
  scheduledDateTime: string; // ISO string
  onTimeReached: () => void;
};

export default function CountdownTimer({ scheduledDateTime, onTimeReached }: Props) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [hasReached, setHasReached] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      try {
        const scheduled = new Date(scheduledDateTime);
        const now = new Date();
        const diff = scheduled.getTime() - now.getTime();

        if (diff <= 0) {
          setHasReached(true);
          onTimeReached();
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeRemaining({ days, hours, minutes, seconds });
      } catch (e) {
        console.error("Countdown error:", e);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [scheduledDateTime, onTimeReached]);

  if (hasReached) {
    return (
      <div className="text-center p-6">
        <div className="text-2xl font-bold text-success mb-2">✓ Test is now available!</div>
        <p className="text-sm text-muted-foreground">You can now start the test.</p>
      </div>
    );
  }

  if (!timeRemaining) {
    return <div className="text-center p-6">Calculating time...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background p-4">
      <div className="w-full max-w-4xl rounded-3xl border border-border bg-card/95 backdrop-blur-xl text-foreground p-8 md:p-12 shadow-2xl">
        {/* Animated Waiting Character */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Cartoon-style clock animation */}
            <div className="relative w-32 h-32 mx-auto">
              {/* Clock face */}
              <div className="absolute inset-0 rounded-full border-4 border-primary/30 bg-primary/5"></div>
              {/* Clock center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary"></div>
              {/* Hour hand - animated */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-bottom w-1 h-12 bg-primary rounded-full"
                style={{
                  transform: `translate(-50%, -100%) rotate(${(timeRemaining.hours % 12) * 30 + timeRemaining.minutes * 0.5}deg)`,
                  transition: 'transform 0.3s ease'
                }}
              ></div>
              {/* Minute hand - animated */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-bottom w-0.5 h-16 bg-primary/80 rounded-full"
                style={{
                  transform: `translate(-50%, -100%) rotate(${timeRemaining.minutes * 6 + timeRemaining.seconds * 0.1}deg)`,
                  transition: 'transform 0.3s ease'
                }}
              ></div>
              {/* Pulsing ring animation */}
              <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20"></div>
            </div>
            
            {/* Floating dots around clock */}
            <div className="absolute -top-4 -left-4 w-3 h-3 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
            <div className="absolute -top-2 -right-6 w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2s' }}></div>
            <div className="absolute -bottom-4 -left-6 w-2.5 h-2.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2s' }}></div>
            <div className="absolute -bottom-2 -right-4 w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '2s' }}></div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Test Scheduled
          </h2>
          <p className="text-base text-muted-foreground">
            Your test will begin automatically when the countdown reaches zero
          </p>
        </div>

        {/* Countdown Display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          {timeRemaining.days > 0 && (
            <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 transform transition-all hover:scale-105">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2 animate-pulse">
                {String(timeRemaining.days).padStart(2, "0")}
              </div>
              <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">Days</div>
            </div>
          )}
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 transform transition-all hover:scale-105">
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2 animate-pulse">
              {String(timeRemaining.hours).padStart(2, "0")}
            </div>
            <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">Hours</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 transform transition-all hover:scale-105">
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2 animate-pulse">
              {String(timeRemaining.minutes).padStart(2, "0")}
            </div>
            <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">Minutes</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 transform transition-all hover:scale-105">
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2" style={{ animation: 'none' }}>
              {String(timeRemaining.seconds).padStart(2, "0")}
            </div>
            <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">Seconds</div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-info/10 border border-info/30 backdrop-blur-sm">
            <div className="relative">
              <div className="h-3 w-3 rounded-full bg-info animate-pulse"></div>
              <div className="absolute inset-0 h-3 w-3 rounded-full bg-info animate-ping opacity-75"></div>
            </div>
            <span className="text-sm font-medium text-info">Waiting for scheduled time...</span>
          </div>
        </div>

        {/* Scheduled Time Display */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Scheduled for: <span className="font-semibold text-foreground">{new Date(scheduledDateTime).toLocaleString()}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

