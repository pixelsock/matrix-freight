import { FreightCalculator } from "../components/freight-calculator";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Matrix Freight Calculator</h1>
        <FreightCalculator />
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <p>©2024 Matrix Freight Calculator. Made with <span>❤️</span> by Stump.Works</p>
        
      </footer>
    </div>
    
  );
}
