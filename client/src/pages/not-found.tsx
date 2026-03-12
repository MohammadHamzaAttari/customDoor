import { DoorOpen, Home } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#faf8f4] via-white to-[#f0ece1] p-4 relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative text-center max-w-md mx-auto z-10 animate-in-up">
        {/* Floating Illustration */}
        <div className="relative w-32 h-32 mx-auto mb-8 animate-float">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-red-50 rounded-3xl shadow-lg border border-white/60 rotate-3 transform transition-transform" />
          <div className="absolute inset-0 bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-stone-100 flex items-center justify-center -rotate-3 overflow-hidden">
            {/* A stylized door icon to fit the theme */}
            <div className="absolute inset-0 bg-gradient-to-b from-stone-50 to-transparent opacity-50" />
            <DoorOpen className="w-16 h-16 text-orange-500/80 mt-2" strokeWidth={1.5} />
          </div>
          {/* Glowing orb behind the icon */}
          <div className="absolute -inset-4 bg-orange-400/20 rounded-full blur-2xl -z-10 animate-pulse-soft" />
        </div>

        {/* Large 404 */}
        <div className="mb-4">
          <h1 className="text-8xl md:text-9xl font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-stone-300 via-stone-400 to-stone-300 select-none drop-shadow-sm">
            404
          </h1>
        </div>

        {/* Description */}
        <div className="space-y-3 mb-10">
          <h2 className="text-2xl font-extrabold text-stone-800 tracking-tight">
            Door Not Found
          </h2>
          <p className="text-[15px] font-medium text-stone-500 leading-relaxed max-w-xs mx-auto">
            It looks like this path leads to a blank wall. Let's get you back to the designer.
          </p>
        </div>

        {/* CTA */}
        <Button
          className="h-14 px-8 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 font-bold text-base shadow-xl shadow-orange-500/20 transition-all duration-300 hover:-translate-y-1 btn-press group overflow-hidden relative"
          onClick={() => setLocation("/")}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
          <Home className="w-5 h-5 mr-2.5 transition-transform group-hover:scale-110" />
          Back to Workshop
        </Button>
      </div>
    </div>
  );
}
