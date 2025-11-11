import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundDither } from "@/components/background-dither";
import { Sparkles, SlidersHorizontal, Palette, SunMedium } from "lucide-react";

export default function HomePage() {
  return (
    <main className="text-foreground relative h-screen w-full overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0">
        <BackgroundDither
          waveColor={[0.5, 0.5, 0.5]}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex h-full flex-col justify-between">
        {/* HERO */}
        <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl md:text-8xl">
            PixelSynth
          </h1>

          <p className="text-foreground mt-6 max-w-xl text-sm font-semibold sm:text-lg">
            Transform images into algorithmic art using real dithering
            techniques. Experiment, compare, and synth your pixels.
          </p>

          <div className="mt-8 flex justify-center">
            <Link href="/editor">
              <Button size="lg" className="text-sm font-semibold tracking-wide">
                Try it now
              </Button>
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-background/60 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
              <FeatureCard
                icon={<Sparkles size={20} />}
                title="Dithering Algorithms"
                desc="15+ classic and modern techniques, all in-browser."
              />
              <FeatureCard
                icon={<SlidersHorizontal size={20} />}
                title="Interactive Controls"
                desc="Adjust scale, contrast, brightness, noise, blur."
              />
              <FeatureCard
                icon={<Palette size={20} />}
                title="Color Tone Mapping"
                desc="Custom shadows, midtones & highlights."
              />
              <FeatureCard
                icon={<SunMedium size={20} />}
                title="Luminance Preservation"
                desc="Keep natural tones while applying dithers."
              />
            </div>

            <div className="border-muted text-muted-foreground -mx-999 mt-6 border-t pt-4 text-center text-xs sm:text-sm">
              <p>
                © 2025 PixelSynth — Created by{" "}
                <a
                  href="https://github.com/m4rcone"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground font-semibold transition-colors hover:text-neutral-200"
                >
                  m4rcone
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

/* ---------------------- FeatureCard ---------------------- */
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800/70 text-neutral-300 shadow-sm">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-neutral-200">{title}</h3>
      <p className="max-w-48 text-xs leading-snug text-neutral-400">{desc}</p>
    </div>
  );
}
