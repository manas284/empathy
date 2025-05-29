import { AppShell } from '@/components/AppShell';
import { ProgressDisplay } from '@/components/progress/ProgressDisplay';
import { GoalManager } from '@/components/progress/GoalManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChartBig, ListChecks } from 'lucide-react';

export default function ProgressPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-primary">Your Wellbeing Journey</h1>
          <p className="text-muted-foreground mt-2">Track your progress, set goals, and celebrate your achievements.</p>
        </header>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-1/2 mx-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChartBig className="h-5 w-5" /> Progress Overview
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" /> Goal Management
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            <ProgressDisplay />
          </TabsContent>
          <TabsContent value="goals" className="mt-6">
            <GoalManager />
          </TabsContent>
        </Tabs>
        
      </div>
    </AppShell>
  );
}
