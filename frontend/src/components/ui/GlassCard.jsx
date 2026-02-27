export default function GlassCard({ className = '', children }) {
  return (
    <div
      className={`modern-glass rounded-2xl ${className}`}
    >
      {children}
    </div>
  );
}
