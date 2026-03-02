import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw } from "lucide-react";
import { logProduction } from "@/utils/productionLogger";
// Image removed

const NotFound = () => {
  const location = useLocation();
  const [isWiggling, setIsWiggling] = useState(false);

  useEffect(() => {
    logProduction('warn', {
      action: '404_error',
      pathname: location.pathname
    });
  }, [location.pathname]);

  const handleWiggle = () => {
    setIsWiggling(true);
    setTimeout(() => setIsWiggling(false), 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-muted/20">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Cute character with bounce animation */}
        <div className="mb-8 animate-fade-in">
          <div 
            className={`w-48 h-48 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center text-sm text-muted-foreground transition-transform duration-300 hover:scale-110 cursor-pointer ${
              isWiggling ? 'animate-bounce' : ''
            }`}
            onClick={handleWiggle}
          >
            (no image)
          </div>
        </div>

        {/* Fun 404 text with gradient */}
        <h1 className="text-8xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
          404
        </h1>

        {/* Playful message */}
        <h2 className="text-2xl font-semibold text-foreground mb-2 animate-fade-in">
          Oops! We're a bit lost too! 🗺️
        </h2>
        
        <p className="text-muted-foreground mb-8 leading-relaxed animate-fade-in">
          Looks like this page went on an adventure without us! 
          Don't worry, even the best explorers get lost sometimes.
        </p>

        {/* Action buttons with hover effects */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
          <Button asChild size="lg" className="hover-scale">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Take Me Home
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => window.location.reload()}
            className="hover-scale"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>

        {/* Fun footer text */}
        <p className="text-xs text-muted-foreground mt-8 animate-fade-in">
          💡 Tip: Click on our friend above for a surprise!
        </p>
      </div>
    </div>
  );
};

export default NotFound;
