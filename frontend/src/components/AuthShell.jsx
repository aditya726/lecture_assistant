import { Link } from "react-router-dom";
import { BookOpenText } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./ui/card";

export default function AuthShell({ title, subtitle, footer, children }) {
  return (
    <div className="premium-shell grain-overlay relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="float-up absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="float-down absolute bottom-[-10rem] right-[-6rem] h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md space-y-6"
      >
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-transform hover:scale-[1.01]">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary via-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20">
              <BookOpenText className="h-4 w-4" />
            </span>
            Lecture Assistant
          </Link>
        </div>

        <Card className="glass-panel glow-ring rounded-3xl">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
            <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
