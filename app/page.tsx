import Analyzer from '@/components/features/Analyzer';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] flex flex-col text-slate-900 font-sans selection:bg-blue-200 selection:text-blue-900">
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 pt-10 space-y-8">
        <Header />
        <Analyzer />
      </div>

      <Footer />
    </main>
  );
}