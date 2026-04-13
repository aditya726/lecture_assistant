import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, AudioLines, Brain, FileText, Pencil, PlayCircle, Sparkles, Wand2 } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

const features = [
  {
    title: "Realtime Transcript Engine",
    description: "Capture every lecture detail with low-latency audio analysis and precision text alignment.",
    icon: AudioLines,
  },
  {
    title: "AI Narrative Structuring",
    description: "Transform raw lecture streams into polished concept maps, summaries, and revision tracks.",
    icon: FileText,
  },
  {
    title: "Contextual Doubt Resolution",
    description: "Highlight any concept and receive an explanation tuned to the exact lecture context.",
    icon: Brain,
  },
];

const statCards = [
  { label: "Processing latency", value: "~28 sec" },
  { label: "Supported sources", value: "Audio, Docs, Images" },
  { label: "Designed for", value: "Ambitious learners" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

function HandwritingAnimation() {
  const cycle = 11.8;
  const lines = [
    {
      text: "Capturing lectures in real time.",
      y: 56,
      startX: 30,
      start: 0,
      duration: 2.7,
      hold: 0.3,
    },
    {
      text: "Structuring insights as complete notes.",
      y: 122,
      startX: 30,
      start: 3.2,
      duration: 2.8,
      hold: 0.3,
    },
    {
      text: "Resolving doubts with context.",
      y: 188,
      startX: 30,
      start: 6.6,
      duration: 2.5,
      hold: 0.25,
    },
  ];

  const measuredLines = lines.map((line) => ({
    ...line,
    // Approximate handwriting advance so pen tip ends near the final character.
    track: Math.max(180, Math.min(420, line.text.length * 9.6)),
  }));

  const [clock, setClock] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const startTime = performance.now();

    const tick = (time) => {
      const elapsedSeconds = (time - startTime) / 1000;
      setClock(elapsedSeconds % cycle);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [cycle]);

  const getLineProgress = (line) => {
    const elapsed = clock - line.start;

    if (elapsed < 0) {
      return { phase: "idle", charCount: 0, writeProgress: 0 };
    }

    if (elapsed <= line.duration) {
      const raw = elapsed / line.duration;
      const eased = 1 - (1 - raw) * (1 - raw);
      const charCount = Math.max(0, Math.min(line.text.length, Math.floor(eased * line.text.length)));
      return { phase: "writing", charCount, writeProgress: eased };
    }

    if (elapsed <= line.duration + line.hold) {
      return { phase: "hold", charCount: line.text.length, writeProgress: 1 };
    }

    return { phase: "done", charCount: line.text.length, writeProgress: 1 };
  };

  const lineStates = measuredLines.map((line) => ({
    line,
    ...getLineProgress(line),
  }));

  const activeWritingIndex = lineStates.findIndex((state) => state.phase === "writing");

  let penX = measuredLines[0].startX;
  let penY = measuredLines[0].y;
  let penOpacity = 0;
  let penRotate = 18;
  let textOpacity = 1;

  if (activeWritingIndex >= 0) {
    const active = lineStates[activeWritingIndex];
    penX = active.line.startX + active.writeProgress * active.line.track;
    penY = active.line.y;
    penOpacity = 1;
    penRotate = 16 - Math.sin(active.writeProgress * Math.PI * 8) * 3;
  } else {
    const previousIndex = lineStates.findLastIndex((state) => state.phase === "hold" || state.phase === "done");

    if (previousIndex >= 0) {
      const currentLine = measuredLines[previousIndex];
      const nextLine = measuredLines[previousIndex + 1];
      const holdStart = currentLine.start + currentLine.duration;
      const moveStart = holdStart + currentLine.hold;
      const moveEnd = nextLine ? nextLine.start : cycle;
      const moveSpan = Math.max(0.001, moveEnd - moveStart);
      const progress = Math.max(0, Math.min(1, (clock - moveStart) / moveSpan));

      if (nextLine) {
        const lift = Math.sin(progress * Math.PI) * 14;
        penX = currentLine.startX + currentLine.track + (nextLine.startX - (currentLine.startX + currentLine.track)) * progress;
        penY = currentLine.y + (nextLine.y - currentLine.y) * progress - lift;
        penOpacity = 0.85;
        penRotate = 22 - progress * 4;
      } else {
        const lift = Math.sin(progress * Math.PI) * 18;
        penX = currentLine.startX + currentLine.track + (measuredLines[0].startX - (currentLine.startX + currentLine.track)) * progress;
        penY = currentLine.y + (measuredLines[0].y - currentLine.y) * progress - lift;
        penOpacity = 0.45 * (1 - progress);
        textOpacity = 1 - Math.pow(progress, 1.5); // Add a small easing curve to keep it legible slightly longer before fading off
        penRotate = 24 - progress * 6;
      }
    }
  }

  return (
    <div className="relative h-[280px] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/45 via-slate-900/55 to-slate-950/85">
      <div className="absolute inset-4 rounded-xl border border-white/12 bg-slate-950/65 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-lg">
        <div className="absolute inset-x-6 top-[18%] border-t border-cyan-300/10" />
        <div className="absolute inset-x-6 top-[42%] border-t border-cyan-300/10" />
        <div className="absolute inset-x-6 top-[66%] border-t border-cyan-300/10" />

        {lineStates.map((state) => (
          <p
            key={state.line.text}
            className="absolute left-7 whitespace-nowrap text-[1.05rem] font-medium tracking-[0.01em] text-cyan-100/90 [font-family:'Segoe_Script','Bradley_Hand','Comic_Sans_MS',cursive]"
            style={{ top: `${state.line.y}px`, opacity: textOpacity }}
          >
            {state.line.text.slice(0, state.charCount)}
          </p>
        ))}

        <div
          className="absolute z-10 top-0 left-0"
          style={{
            opacity: penOpacity,
            transform: `translate3d(${penX}px, ${penY - 15}px, 0) rotate(${penRotate}deg)`,
            transition: "opacity 120ms ease",
            willChange: "transform, opacity",
          }}
        >
          <motion.div
            animate={{ rotate: [0, 1.6, -1.2, 1.1, -0.7, 0] }}
            transition={{ duration: 0.24, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div className="h-7 w-4 rounded-full border border-amber-200/50 bg-gradient-to-b from-amber-200 to-amber-500 shadow-[0_2px_8px_rgba(251,191,36,0.35)]" />
            <div className="absolute -top-3 left-[-1px] flex h-3 w-[18px] items-center justify-center rounded-full border border-slate-200/40 bg-slate-300/80">
              <Pencil className="h-2.5 w-2.5 text-slate-900/85" />
            </div>
            <div className="absolute bottom-[-4px] left-[4px] h-2 w-2 rotate-45 bg-slate-200" />
            <div className="absolute bottom-[-6px] left-[5px] h-1.5 w-1.5 rotate-45 bg-slate-900" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [userCount, setUserCount] = useState(null);

  useEffect(() => {
    api
      .get("/auth/stats")
      .then((res) => setUserCount(res.data.user_count ?? 0))
      .catch(() => setUserCount(null));
  }, []);

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Preparing your workspace experience...</div>;
  }

  return (
    <div className="premium-shell grain-overlay relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="https://videos.pexels.com/video-files/5532770/5532770-hd_1920_1080_30fps.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(2,6,23,0.86),rgba(10,16,35,0.76)_35%,rgba(10,16,35,0.88))]" />
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-12rem] top-[-10rem] h-[30rem] w-[30rem] rounded-full bg-cyan-400/20 blur-[120px]" />
        <div className="absolute right-[-8rem] top-[6rem] h-[28rem] w-[28rem] rounded-full bg-violet-500/20 blur-[120px]" />
      </div>

      <header className="relative border-b border-white/10 bg-background/30 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20">
              <Sparkles className="h-4 w-4" />
            </span>
            Lecture Assistant
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild className="rounded-full px-6">
                <Link to="/workspace">
                  Open Studio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="rounded-full">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild className="rounded-full px-6">
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-4 pb-24 pt-12 sm:px-6 lg:pt-20">
        <motion.section variants={container} initial="hidden" animate="show" className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div variants={item} className="space-y-7">
            <Badge variant="secondary" className="rounded-full border border-cyan-300/40 bg-cyan-500/10 text-cyan-200 dark:text-cyan-300">
              <Wand2 className="mr-1 h-3.5 w-3.5" />
              Crafted for deep focus
            </Badge>

            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.05]">
              A study product with
              <span className="text-gradient"> cinematic clarity</span>
              , not dashboard noise.
            </h1>

            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Lecture Assistant feels like a premium creative tool. Capture audio, structure insights, resolve doubts,
              and build revision assets in one fluid interface.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link to={user ? "/workspace" : "/register"}>
                  {user ? "Enter workspace" : "Launch your account"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <Link to={user ? "/workspace" : "/login"}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Experience product
                </Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Trusted by {userCount !== null ? `${userCount.toLocaleString()}+` : "hundreds of"} students and mentors.
            </p>
          </motion.div>

          <motion.div variants={item} className="grid gap-4">
            <Card className="glass-panel glow-ring overflow-hidden">
              <CardContent className="relative p-0">
                <HandwritingAnimation />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {statCards.map((stat, idx) => (
                <motion.div key={stat.label} className={idx % 2 ? "float-up" : "float-down"}>
                  <Card className="glass-panel h-full">
                    <CardHeader className="space-y-1 pb-4">
                      <CardDescription className="text-xs uppercase tracking-wider">{stat.label}</CardDescription>
                      <CardTitle className="text-xl sm:text-2xl">{stat.value}</CardTitle>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-120px" }}
          className="mt-16 grid gap-5 md:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={item}>
                <Card className="glass-panel group h-full overflow-hidden">
                  <CardHeader>
                    <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/25 to-violet-500/25 text-cyan-300 transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="p-0 text-cyan-300 hover:bg-transparent hover:text-cyan-200">
                      Explore capability
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.section>
      </main>
    </div>
  );
}
