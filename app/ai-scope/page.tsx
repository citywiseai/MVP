import AIScopeChat from '@/app/components/AIScopeChat';

export default function AIScopePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2c4f6f] to-[#9caf88] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI Scope Capture</h1>
          <p className="text-white/90">
            Let Scout guide you through your project setup
          </p>
        </div>

        <AIScopeChat />
      </div>
    </div>
  );
}
