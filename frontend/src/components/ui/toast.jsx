import * as React from "react"

const ToastContext = React.createContext({})

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([])

  const toast = React.useCallback((props) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...props, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, props.duration || 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 w-full md:max-w-md p-4 space-y-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-lg shadow-lg ${
              t.variant === 'destructive'
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-900 border'
            }`}
          >
            {t.title && <div className="font-semibold">{t.title}</div>}
            {t.description && <div className="text-sm opacity-90">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}
