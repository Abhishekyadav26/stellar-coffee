import { Navbar } from "@/components/navbar";
import { CoffeeBuyer } from "@/components/coffee-buyer";
import { Leaderboard } from "@/components/leaderboard";
import { TipHistory } from "@/components/tip-history";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            ☕ Buy Me a Coffee
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Support your favorite creators with coffee donations on the Stellar
            blockchain. Every coffee helps keep the creativity flowing!
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Coffee Purchase Form - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <CoffeeBuyer />
              </div>
              <div className="md:col-span-2">
                <TipHistory />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Leaderboard />

            {/* Contract Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Contract Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Contract ID:</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 break-all mt-1">
                    CAYRJABAYNE4Q5PYYILXIUZOWKCHJGMURXXWAD7MXGFHGRRSUG5CCIKF
                  </p>
                </div>
                <div>
                  <span className="font-medium">Network:</span>
                  <p className="text-gray-600 dark:text-gray-300">
                    Stellar Testnet
                  </p>
                </div>
                <div>
                  <span className="font-medium">Token:</span>
                  <p className="text-gray-600 dark:text-gray-300">
                    XLM (Native)
                  </p>
                </div>
              </div>
            </div>

            {/* How it Works */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">How it Works</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full flex items-center justify-center text-xs font-medium">
                    1
                  </span>
                  <span>Connect your Stellar wallet</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full flex items-center justify-center text-xs font-medium">
                    2
                  </span>
                  <span>Choose amount and leave a message</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full flex items-center justify-center text-xs font-medium">
                    3
                  </span>
                  <span>Confirm transaction on Stellar</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full flex items-center justify-center text-xs font-medium">
                    4
                  </span>
                  <span>See your name on the leaderboard!</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Built with ❤️ using Next.js, Tailwind CSS, and Stellar Blockchain
          </p>
          <p className="mt-2">
            Testnet Network • Contract ID:
            CAYRJABAYNE4Q5PYYILXIUZOWKCHJGMURXXWAD7MXGFHGRRSUG5CCIKF
          </p>
        </div>
      </div>
    </div>
  );
}
