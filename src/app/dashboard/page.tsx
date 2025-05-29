
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AppShell } from '@/components/AppShell';
import { Bot, BarChart2, Settings, ArrowRight, Lightbulb, BrainCircuit } from 'lucide-react';
import Image from 'next/image';

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="flex flex-col space-y-12">
        <section className="text-center py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-xl shadow-sm">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl">
              Welcome to <span className="text-primary">EmpathyAI</span>
            </h1>
            <p className="mt-8 max-w-2xl mx-auto text-xl leading-8 text-muted-foreground">
              Your personalized AI companion for navigating life's challenges and fostering emotional wellbeing.
            </p>
            <div className="mt-12">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:scale-105">
                <Link href="/therapy">
                  Start a Therapy Session <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out rounded-lg">
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
                  <Bot className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">AI Therapy Sessions</CardTitle>
                <CardDescription>Engage in empathetic conversations tailored to your needs.</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p>Our AI uses advanced techniques to provide supportive dialogue, helping you process emotions and gain insights.</p>
              </CardContent>
              <CardFooter className="justify-center">
                <Button variant="outline" asChild>
                  <Link href="/therapy">Begin Session</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out rounded-lg">
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-accent/10 rounded-full inline-block mb-4">
                  <BarChart2 className="h-12 w-12 text-accent" />
                </div>
                <CardTitle className="text-2xl">Track Your Progress</CardTitle>
                <CardDescription>Monitor your journey and celebrate your growth.</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p>Set personal goals, review session notes, and visualize your progress over time. Stay motivated and mindful.</p>
              </CardContent>
              <CardFooter className="justify-center">
                <Button variant="outline" asChild>
                  <Link href="/progress">View Progress</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out rounded-lg">
              <CardHeader className="items-center text-center">
                 <div className="p-4 bg-secondary/20 rounded-full inline-block mb-4">
                  <Settings className="h-12 w-12 text-secondary-foreground" />
                </div>
                <CardTitle className="text-2xl">Personalize Settings</CardTitle>
                <CardDescription>Customize your experience for maximum comfort.</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p>Adjust audio settings, choose preferred voice styles, and manage your profile to make EmpathyAI truly yours.</p>
              </CardContent>
              <CardFooter className="justify-center">
                <Button variant="outline" asChild>
                  <Link href="/settings">Go to Settings</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
        
        <section className="container mx-auto px-4">
          <Card className="overflow-hidden rounded-lg shadow-lg">
            <div className="p-8 md:p-12 bg-card">
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                <div className="flex-1">
                  <h2 className="text-3xl font-semibold text-foreground mb-6 flex items-center">
                    <Lightbulb className="h-10 w-10 mr-3 text-primary" />
                    How EmpathyAI Works
                  </h2>
                  <p className="text-muted-foreground mb-4 text-lg">
                    EmpathyAI leverages cutting-edge generative AI to provide a hyper-personalized therapeutic experience. By understanding your unique profile – including age, background, and specific challenges like anxiety or breakup types – our AI adapts its communication style and therapeutic techniques (CBT, IPT, Grief Counseling).
                  </p>
                  <p className="text-muted-foreground text-lg">
                    Our system uses British English with appropriate medical terminology to create a professional yet comforting environment. The AI's empathy level dynamically adjusts, fostering a stronger connection over time. This contextual adaptation ensures that you receive relevant advice and truly empathetic responses.
                  </p>
                </div>
                <div className="flex-shrink-0 w-full lg:w-1/3 mt-6 lg:mt-0">
                  <Image 
                    src="https://placehold.co/400x400.png" 
                    alt="AI working illustration" 
                    width={400} 
                    height={400}
                    className="rounded-lg shadow-md object-cover"
                    data-ai-hint="abstract ai brain"
                  />
                </div>
              </div>
            </div>
          </Card>
        </section>

      </div>
    </AppShell>
  );
}
