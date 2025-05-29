import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AppShell } from '@/components/AppShell';
import { Bot, BarChart2, Settings, ArrowRight, Lightbulb } from 'lucide-react';
import Image from 'next/image';

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="flex flex-col space-y-8">
        <section className="text-center py-12 bg-gradient-to-r from-primary/10 via-background to-accent/10 rounded-lg shadow-sm">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Welcome to <span className="text-primary">EmpathyAI</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-muted-foreground">
            Your personalized AI companion for navigating life's challenges and fostering emotional wellbeing.
          </p>
          <div className="mt-10">
            <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/therapy">
                Start a Therapy Session <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Bot className="h-10 w-10 text-primary mb-2" />
                <CardTitle>AI Therapy Sessions</CardTitle>
                <CardDescription>Engage in empathetic conversations tailored to your needs.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Our AI uses advanced techniques to provide supportive dialogue, helping you process emotions and gain insights.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild>
                  <Link href="/therapy">Begin Session</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart2 className="h-10 w-10 text-accent mb-2" />
                <CardTitle>Track Your Progress</CardTitle>
                <CardDescription>Monitor your journey and celebrate your growth.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Set personal goals, review session notes, and visualize your progress over time. Stay motivated and mindful.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild>
                  <Link href="/progress">View Progress</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Settings className="h-10 w-10 text-secondary-foreground mb-2" />
                <CardTitle>Personalize Settings</CardTitle>
                <CardDescription>Customize your experience for maximum comfort.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Adjust audio settings, choose preferred voice styles, and manage your profile to make EmpathyAI truly yours.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild>
                  <Link href="/settings">Go to Settings</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
        
        <section className="mt-12 p-8 bg-card rounded-lg shadow">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-3xl font-semibold text-foreground mb-4">
                <Lightbulb className="inline-block h-8 w-8 mr-2 text-primary" />
                How EmpathyAI Works
              </h2>
              <p className="text-muted-foreground mb-4">
                EmpathyAI leverages cutting-edge generative AI to provide a hyper-personalized therapeutic experience. By understanding your unique profile – including age, background, and specific challenges like anxiety or breakup types – our AI adapts its communication style and therapeutic techniques (CBT, IPT, Grief Counseling).
              </p>
              <p className="text-muted-foreground">
                Our system uses British English with appropriate medical terminology to create a professional yet comforting environment. The AI's empathy level dynamically adjusts, fostering a stronger connection over time. This contextual adaptation ensures that you receive relevant advice and truly empathetic responses.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Image 
                src="https://placehold.co/300x300.png" 
                alt="AI working illustration" 
                width={300} 
                height={300}
                className="rounded-lg shadow-md"
                data-ai-hint="abstract ai brain"
              />
            </div>
          </div>
        </section>

      </div>
    </AppShell>
  );
}
