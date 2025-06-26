import AppHeader from "./components/AppHeader";
import HeroSection from "./components/HeroSection";
import ConversionFlow from "./components/ConversionFlow";
import FeatureCards from "./components/FeatureCards";
import AppFooter from "./components/AppFooter";
import { useConversion } from "./hooks/useConversion";

function App() {
  const {
    isConverting,
    conversionResult,
    progress,
    conversionId,
    showStatusChecker,
    handleConversionStart,
    handleReset,
    handleViewResults,
    handleCheckExistingConversion,
  } = useConversion();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 space-y-12">
          <HeroSection />

          <ConversionFlow
            isConverting={isConverting}
            conversionResult={conversionResult}
            showStatusChecker={showStatusChecker}
            conversionId={conversionId}
            progress={progress}
            onConversionStart={handleConversionStart}
            onViewResults={handleViewResults}
            onReset={handleReset}
            onCheckExistingConversion={handleCheckExistingConversion}
          />

          <FeatureCards />
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

export default App;
