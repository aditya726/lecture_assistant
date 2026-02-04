export default function GlassCard({ className = '', children }) {
  return (
    <div
      className={`sketchy-card rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
}
