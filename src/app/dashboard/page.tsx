
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AppShell } from '@/components/AppShell';
import { Bot, BarChart2, Settings, ArrowRight, Lightbulb, BrainCircuit } from 'lucide-react';
import Image from 'next/image';

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="flex flex-col space-y-16">
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-xl shadow-sm">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="md:w-1/2 lg:w-3/5 text-center md:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                Welcome to <span className="text-primary">EmpathyAI</span>
              </h1>
              <p className="mt-6 max-w-xl mx-auto md:mx-0 text-lg sm:text-xl leading-relaxed text-muted-foreground">
                Your personalized AI companion for navigating life's challenges and fostering emotional wellbeing through empathetic conversation.
              </p>
              <div className="mt-10">
                <Button
                  size="lg"
                  asChild
                  className="shadow-lg hover:shadow-primary/30 hover:bg-primary/90 transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  <Link href="/therapy">
                    Start a Therapy Session <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 lg:w-2/5 mt-8 md:mt-0 flex justify-center md:justify-end">
              <Image
                src="https://placehold.co/600x400.png"
                alt="Empathetic AI Connection"
                width={600}
                height={400}
                className="rounded-xl shadow-2xl object-cover"
                data-ai-hint="empathy connection"
              />
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out rounded-lg overflow-hidden">
              <CardHeader className="items-center text-center pt-8 pb-6">
                <div className="p-5 bg-primary/10 rounded-full inline-block mb-4">
                  <Bot className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">AI Therapy Sessions</CardTitle>
                <CardDescription className="mt-2 px-4">Engage in empathetic conversations tailored to your needs.</CardDescription>
              </CardHeader>
              <CardContent className="text-center px-6">
                <p className="text-muted-foreground">Our AI uses advanced techniques to provide supportive dialogue, helping you process emotions and gain insights.</p>
              </CardContent>
              <CardFooter className="justify-center pb-8 pt-4">
                <Button variant="outline" asChild>
                  <Link href="/therapy">Begin Session</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out rounded-lg overflow-hidden">
              <CardHeader className="items-center text-center pt-8 pb-6">
                <div className="p-5 bg-accent/10 rounded-full inline-block mb-4">
                  <BarChart2 className="h-12 w-12 text-accent" />
                </div>
                <CardTitle className="text-2xl">Track Your Progress</CardTitle>
                <CardDescription className="mt-2 px-4">Monitor your journey and celebrate your growth.</CardDescription>
              </CardHeader>
              <CardContent className="text-center px-6">
                <p className="text-muted-foreground">Set personal goals, review session notes, and visualize your progress over time. Stay motivated and mindful.</p>
              </CardContent>
              <CardFooter className="justify-center pb-8 pt-4">
                <Button variant="outline" asChild>
                  <Link href="/progress">View Progress</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out rounded-lg overflow-hidden">
              <CardHeader className="items-center text-center pt-8 pb-6">
                 <div className="p-5 bg-secondary/20 rounded-full inline-block mb-4">
                  <Settings className="h-12 w-12 text-secondary-foreground" />
                </div>
                <CardTitle className="text-2xl">Personalize Settings</CardTitle>
                <CardDescription className="mt-2 px-4">Customize your experience for maximum comfort.</CardDescription>
              </CardHeader>
              <CardContent className="text-center px-6">
                <p className="text-muted-foreground">Adjust audio settings, choose preferred voice styles, and manage your profile to make EmpathyAI truly yours.</p>
              </CardContent>
              <CardFooter className="justify-center pb-8 pt-4">
                <Button variant="outline" asChild>
                  <Link href="/settings">Go to Settings</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
        
        <section className="container mx-auto px-4">
          <Card className="overflow-hidden rounded-xl shadow-lg bg-card">
            <div className="p-8 md:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                <div className="flex-1">
                  <h2 className="text-4xl font-semibold text-foreground mb-6 flex items-center">
                    <Lightbulb className="h-10 w-10 mr-4 text-primary" />
                    How EmpathyAI Works
                  </h2>
                  <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                    EmpathyAI leverages cutting-edge generative AI to provide a hyper-personalized therapeutic experience. By understanding your unique profile – including age, background, and specific challenges like anxiety or breakup types – our AI adapts its communication style and therapeutic techniques (CBT, IPT, Grief Counseling).
                  </p>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Our system uses British English with appropriate medical terminology to create a professional yet comforting environment. The AI's empathy level dynamically adjusts, fostering a stronger connection over time. This contextual adaptation ensures that you receive relevant advice and truly empathetic responses.
                  </p>
                </div>
                <div className="flex-shrink-0 w-full lg:w-2/5 mt-6 lg:mt-0">
                  <Image 
                    src="https://placehold.co/600x600.png" 
                    alt="AI working illustration" 
                    width={600} 
                    height={600}
                    className="rounded-lg shadow-2xl object-cover aspect-square"
                    data-ai-hint="abstract brain"
                  />
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="container mx-auto px-4 text-center py-12">
          <h2 className="text-3xl font-semibold text-foreground mb-4">Ready to begin your journey?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Take the first step towards understanding yourself better and finding support.</p>
          <Button 
            size="lg" 
            asChild
            className="shadow-md hover:shadow-primary/20 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            <Link href="/therapy">
              <BrainCircuit className="mr-2 h-5 w-5" /> Start Your First Session
            </Link>
          </Button>
        </section>

      </div>
    </AppShell>
  );
}
