import { useEffect, useState } from "react";

export const useShouldEnableVimMode = (): boolean => {
  const [enableVim, setEnableVim] = useState(true);

  useEffect(() => {
    // Check if primary input is touch
    const isTouchPrimary = window.matchMedia('(pointer: coarse)').matches;
    
    // Check if device has touch capability
    const hasTouch = 
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0;
    
    // Disable vim mode if touch is the primary input method
    // or if it's a touch-only device
    const shouldDisableVim = isTouchPrimary || (hasTouch && !window.matchMedia('(pointer: fine)').matches);
    
    setEnableVim(!shouldDisableVim);
  }, []);

  return enableVim;
}
