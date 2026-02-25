// components/FreighterTroubleshoot.tsx
"use client";

export default function FreighterTroubleshoot() {
  return (
    <div className="bg-orange-900/30 border border-orange-700/50 rounded-xl p-4 space-y-3 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔧</span>
        <h3 className="font-semibold text-orange-300">Freighter Not Detected?</h3>
      </div>
      
      <div className="space-y-3 text-sm text-orange-200">
        <div className="bg-orange-800/30 rounded-lg p-3 border border-orange-700/50">
          <p className="font-semibold text-orange-300 mb-2">Quick Fix Steps:</p>
          <ol className="space-y-2 text-xs">
            <li className="flex items-start gap-2">
              <span className="font-bold text-orange-400 mt-0.5">1.</span>
              <div>
                <p className="font-medium">Install Freighter Extension</p>
                <a 
                  href="https://chromewebstore.google.com/detail/freighter/bcplhfojebgpmcoelaeglojcdhefgagn" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-orange-300 underline hover:text-orange-200 text-xs"
                >
                  Open Chrome Web Store →
                </a>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-orange-400 mt-0.5">2.</span>
              <div>
                <p className="font-medium">Enable Extension</p>
                <p className="text-orange-300">Click puzzle icon → Pin Freighter to toolbar</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-orange-400 mt-0.5">3.</span>
              <div>
                <p className="font-medium">Refresh This Page</p>
                <p className="text-orange-300">Press F5 or Ctrl+R after installation</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-orange-400 mt-0.5">4.</span>
              <div>
                <p className="font-medium">Try Incognito Mode</p>
                <p className="text-orange-300">If other extensions interfere, try incognito</p>
              </div>
            </li>
          </ol>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="bg-orange-800/20 rounded-lg p-2 border border-orange-700/30">
            <p className="text-xs font-semibold text-orange-300 mb-1">🌐 Browser Support:</p>
            <p className="text-xs text-orange-200">Chrome, Brave, Edge (recommended)</p>
          </div>
          <div className="bg-orange-800/20 rounded-lg p-2 border border-orange-700/30">
            <p className="text-xs font-semibold text-orange-300 mb-1">⚡ Alternative:</p>
            <p className="text-xs text-orange-200">Try <a href="https://rabet.io" target="_blank" rel="noopener noreferrer" className="underline">Rabet Wallet</a> as backup</p>
          </div>
        </div>
      </div>
    </div>
  );
}
