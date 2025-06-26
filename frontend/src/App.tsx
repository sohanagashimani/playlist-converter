import { Layout } from "antd";
import AppHeader from "./components/AppHeader";
import HeroSection from "./components/HeroSection";
import ConversionFlow from "./components/ConversionFlow";
import FeatureCards from "./components/FeatureCards";
import AppFooter from "./components/AppFooter";
import { useConversion } from "./hooks/useConversion";

const { Content } = Layout;

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
    <div className="w-full min-h-screen tuneswap-bg">
      <AppHeader />

      <Content className="w-full flex-1">
        <div className="max-w-6xl mx-auto md:p-6 space-y-8 p-3">
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
      </Content>

      <AppFooter />
    </div>
  );
}

export default App;
