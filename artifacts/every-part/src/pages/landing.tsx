import { Link } from "wouter";
import { ArrowRight, HeartHandshake, Map, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-secondary/20 selection:text-secondary">
      {/* Navigation */}
      <header className="fixed top-0 inset-x-0 z-50 transition-all border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-serif text-lg font-bold">
              E
            </div>
            <span className="font-serif text-2xl font-medium tracking-tight text-foreground">
              Every Part
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="font-medium" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button className="font-medium bg-primary hover:bg-primary/90" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 overflow-hidden px-4">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[30rem] h-[30rem] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-secondary"></span>
              For Church Leaders & Pastors
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-medium leading-[1.1] tracking-tight mb-8 text-foreground">
              Help your people see how <span className="text-secondary italic pr-2">God has wired them.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
              Every Part is a ministry discovery tool that replaces static volunteer forms with an engaging assessment, helping you start meaningful conversations about serving.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-medium rounded-full bg-primary hover:bg-primary/90" asChild>
                <Link href="/sign-up">Start Free for Your Church</Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base font-medium rounded-full border-border bg-transparent hover:bg-muted" asChild>
                <Link href="/profile/demo-church">Preview Assessment</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-card border-y border-border">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight mb-4">Beyond the clipboard</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Volunteer forms are transactional. Every Part builds a profile that honors the whole person.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-10">
              {[
                {
                  icon: HeartHandshake,
                  title: "Meaningful Discovery",
                  description: "Guide members through a thoughtful assessment covering passions, skills, experience, and spiritual gifts."
                },
                {
                  icon: Map,
                  title: "Clear Pathways",
                  description: "Review comprehensive profiles that make it obvious where someone might thrive, not just where there's a gap."
                },
                {
                  icon: Users,
                  title: "Better Conversations",
                  description: "Generate beautiful, print-ready profiles to guide your pastoral and leadership conversations."
                }
              ].map((feature, i) => (
                <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-xl font-medium mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <section className="py-24 md:py-32 relative overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-foreground/5 to-transparent pointer-events-none" />
          <div className="container mx-auto px-6 max-w-3xl text-center relative z-10">
            <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight mb-6">
              Ready to equip every part?
            </h2>
            <p className="text-primary-foreground/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Set up your church's custom discovery assessment in under 5 minutes.
            </p>
            <Button size="lg" className="h-14 px-8 text-base font-medium rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" asChild>
              <Link href="/sign-up">
                Create Your Church Profile <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      
      <footer className="py-12 bg-background text-center text-muted-foreground border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center font-serif text-sm font-bold">
              E
            </div>
            <span className="font-serif text-lg font-medium text-foreground">
              Every Part
            </span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Every Part. Built for the local church.</p>
        </div>
      </footer>
    </div>
  );
}
