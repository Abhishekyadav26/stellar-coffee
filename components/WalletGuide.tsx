// components/WalletGuide.tsx
"use client";

export default function WalletGuide() {
  return (
    <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4 space-y-3 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">💡</span>
        <h3 className="font-semibold text-blue-300">
          How to Connect Freighter Wallet
        </h3>
      </div>

      <div className="space-y-2 text-sm text-blue-200">
        <div className="flex items-start gap-2">
          <span className="font-bold text-blue-400">1.</span>
          <div>
            <p className="font-medium">Install Freighter Extension</p>
            <p className="text-xs text-blue-300 mt-1">
              Visit{" "}
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                freighter.app
              </a>{" "}
              or install from Chrome Web Store
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="font-bold text-blue-400">2.</span>
          <div>
            <p className="font-medium">Refresh This Page</p>
            <p className="text-xs text-blue-300 mt-1">
              After installation, refresh the page to detect Freighter
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="font-bold text-blue-400">3.</span>
          <div>
            <p className="font-medium">Unlock Freighter</p>
            <p className="text-xs text-blue-300 mt-1">
              Click the Freighter icon in your browser toolbar and unlock with
              your password
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="font-bold text-blue-400">4.</span>
          <div>
            <p className="font-medium">Switch to Testnet</p>
            <p className="text-xs text-blue-300 mt-1">
              In Freighter settings, ensure &ldquo;Testnet&rdquo; network is
              selected
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="font-bold text-blue-400">5.</span>
          <div>
            <p className="font-medium">Connect & Approve</p>
            <p className="text-xs text-blue-300 mt-1">
              Click &ldquo;Connect Freighter&rdquo; and approve the connection
              request in the popup
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-blue-700/50">
        <p className="text-xs text-blue-300">
          <strong>Still having trouble?</strong> Try disabling other wallet
          extensions or using an incognito window.
        </p>
      </div>
    </div>
  );
}
