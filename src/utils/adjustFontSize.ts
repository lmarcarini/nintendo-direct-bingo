export const adjustFontSize = (element: HTMLDivElement) => {
        // Configuration parameters
        const config = {
          baseFontSize: 36,     // Starting font size in pixels
          scalingFactor: 0.949,  // How aggressively to shrink (0.8-0.95 works best)
          minFontSize: 8,       // Minimum allowed font size
          maxIterations: 20,    // Safety limit for adjustments
          overflowPadding: 5    // Pixel buffer to prevent tight fits
        };
      
        // Reset to base size before calculation
        element.style.fontSize = `${config.baseFontSize}px`;
        
        // Get dimensions
        const containerHeight = element.clientHeight - config.overflowPadding;
        const containerWidth = element.clientWidth - config.overflowPadding;
      
        let currentSize = config.baseFontSize;
        let iterations = 0;
      
        const checkFit = () => {
          const textHeight = element.scrollHeight;
          const textWidth = element.scrollWidth;
          
          return textHeight <= containerHeight && 
                 textWidth <= containerWidth;
        };
      
        // Adjust font size until content fits or we reach limits
        requestAnimationFrame(() => {
          while (iterations < config.maxIterations && currentSize > config.minFontSize) {
            if (checkFit()) break;
            
            currentSize *= config.scalingFactor;
            element.style.fontSize = `${currentSize}px`;
            iterations++;
          }
        });
      };