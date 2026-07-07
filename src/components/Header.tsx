import { Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-100 h-16 flex items-center px-6">
      <div className="max-w-4xl mx-auto w-full flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center text-brand-50">
          <Sparkles className="w-4 h-4" />
        </div>
        <h1 className="text-xl font-medium tracking-tight text-brand-900">
          Lumina
        </h1>
      </div>
    </header>
  );
}
