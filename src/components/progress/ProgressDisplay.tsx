'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, CheckCircle, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

// Mock data - replace with actual data fetching
const mockProgressData = {
  overallProgress: 0, // Initial value
  sessionsCompleted: 0,
  goalsAchieved: 0,
  moodTrend: [
    { date: 'Week 1', moodScore: 5 },
    { date: 'Week 2', moodScore: 6 },
    { date: 'Week 3', moodScore: 7 },
    { date: 'Week 4', moodScore: 6.5 },
  ],
};

// ShadCN Chart component usage would require more setup (recharts)
// For simplicity, we'll use basic stats and progress bars.

export function ProgressDisplay() {
  const [progressValue, setProgressValue] = useState(0);
  const [sessions, setSessions] = useState(0);
  const [goals, setGoals] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const timer = setTimeout(() => {
      setProgressValue(65); // Example static value
      setSessions(8);
      setGoals(3);
    }, 500);
    return () => clearTimeout(timer);
  }, []);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Your Progress Overview
        </CardTitle>
        <CardDescription>A snapshot of your journey towards wellbeing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-base font-medium text-primary">Overall Progress</span>
            <span className="text-sm font-medium text-primary">{progressValue}%</span>
          </div>
          <Progress value={progressValue} aria-label={`Overall progress: ${progressValue}%`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{sessions}</p>
                  <p className="text-sm text-muted-foreground">Sessions Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Activity className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{goals}</p>
                  <p className="text-sm text-muted-foreground">Goals Achieved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
            <h3 className="text-lg font-semibold mb-2">Mood Trend (Mock)</h3>
            <div className="p-4 border rounded-md bg-background">
                <p className="text-sm text-muted-foreground">
                    Visualizing mood trends can help identify patterns and progress.
                    A chart would typically be displayed here. (e.g., Average mood score: {mockProgressData.moodTrend.reduce((acc, curr) => acc + curr.moodScore, 0) / mockProgressData.moodTrend.length}/10)
                </p>
                {/* Placeholder for chart */}
                <div className="h-32 flex items-center justify-center bg-muted rounded-md mt-2">
                    <p className="text-muted-foreground italic">Mood Chart Area</p>
                </div>
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
