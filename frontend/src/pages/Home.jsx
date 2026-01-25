import { Link } from 'react-router-dom';
import React from 'react'
import { motion } from 'framer-motion'
import GlassCard from '../components/ui/GlassCard'
import { Sparkles, Mic, Upload, MessageSquare, BookOpen, Lightbulb, Tag, Key, BarChart, FileText } from 'lucide-react'
 
export default function Home() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 14 } },
  }

  const features = [
    { title: 'AI Chat', desc: 'Chat with your materials', icon: MessageSquare, to: '/ai-chat', iconClass: 'text-cyan-300' },
    { title: 'Summarize', desc: 'Concise summaries of text', icon: BookOpen, to: '/ai-summarize', iconClass: 'text-emerald-300' },
    { title: 'Explain Doubt', desc: 'Clear explanations fast', icon: Lightbulb, to: '/ai-explain', iconClass: 'text-violet-300' },
    { title: 'Extract Topics', desc: 'Main themes and ideas', icon: Tag, to: '/ai-topics', iconClass: 'text-orange-300' },
    { title: 'Keywords', desc: 'Important terms & phrases', icon: Key, to: '/ai-keywords', iconClass: 'text-pink-300' },
    { title: 'Difficulty', desc: 'Assess content difficulty', icon: BarChart, to: '/ai-difficulty', iconClass: 'text-red-300' },
    { title: 'Texts', desc: 'Manage your documents', icon: FileText, to: '/texts', iconClass: 'text-slate-200' },
  ]

  return (
    <div className="relative px-6 py-10 md:px-10 lg:px-16 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Smarter study with voice, files, and AI
            </div>
            <h1 className="mt-6 bg-gradient-to-br from-white to-white/70 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-6xl">
              Learn faster with a calm, glassy workspace
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-white/70 md:text-lg">
              Summarize lectures, extract topics, and chat with your materials using
              a refined, distraction-free interface.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link to="/ai-chat" className="rounded-xl bg-white/90 px-4 py-2.5 text-sm font-medium text-gray-900 shadow hover:bg-white">
                Get Started
              </Link>
              <Link to="/texts" className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/15">
                Explore Texts
              </Link>
            </div>
          </motion.div>

          <motion.div variants={container} initial="hidden" animate="show" className="mt-12 grid gap-6 md:grid-cols-3">
            <motion.div variants={item}>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Speak naturally</h3>
                    <p className="mt-1 text-sm text-white/70">Real-time transcription with Whisper for quick notes.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                    <Mic className="h-5 w-5 text-cyan-300" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={item}>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Upload anything</h3>
                    <p className="mt-1 text-sm text-white/70">PDFs, docs, images, and videos for fast summaries.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                    <Upload className="h-5 w-5 text-indigo-300" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={item}>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Readable responses</h3>
                    <p className="mt-1 text-sm text-white/70">Clean Markdown formatting and gentle animations.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                    <MessageSquare className="h-5 w-5 text-emerald-300" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.6 }}
            className="mt-12"
          >
            <GlassCard className="p-6 md:p-10">
              <div className="grid items-center gap-8 md:grid-cols-2">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Everything in one place</h2>
                  <p className="mt-2 text-white/70">
                    Voice notes, document uploads, and AI chat work together seamlessly. Simple, fast, and reliable.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-white/75">
                    <li>• Smooth glass UI with focus on readability</li>
                    <li>• Fast interactions with subtle motion</li>
                    <li>• Markdown-rendered answers without stray symbols</li>
                  </ul>
                </div>
                <div className="relative">
                  <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-cyan-500/15 to-indigo-500/15 blur-2xl" />
                  <div className="aspect-video w-full rounded-xl border border-white/10 bg-white/5" />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto mt-10 max-w-6xl">
        <div className="mb-4 text-white/70">Quick actions</div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {features.map((f, idx) => {
            const Icon = f.icon
            return (
              <motion.div key={f.title} variants={item}>
                <Link to={f.to} className="block">
                  <GlassCard className="p-5 hover:bg-white/10 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-xl border border-white/10 bg-white/10 p-3 ${f.iconClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{f.title}</div>
                        <div className="text-sm text-white/70">{f.desc}</div>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

