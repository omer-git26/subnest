export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="max-w-5xl bg-white rounded-3xl shadow-xl p-10">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-bold mb-4">SubNest</h1>

          <p className="text-xl text-gray-600">
            Track personal and shared subscriptions before they drain your wallet.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-100 rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-3">Personal Tracking</h2>

            <p className="text-gray-600">
              Track Netflix, ChatGPT, gym memberships, insurance, utilities and more.
            </p>
          </div>

          <div className="bg-gray-100 rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-3">Shared Plans</h2>

            <p className="text-gray-600">
              Split family subscriptions and calculate who owes what.
            </p>
          </div>

          <div className="bg-gray-100 rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-3">Renewal Alerts</h2>

            <p className="text-gray-600">
              Never forget renewals or yearly payments again.
            </p>
          </div>
        </div>

        <div className="bg-black rounded-3xl text-white p-8 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Subscription creep is real.
            </h2>

            <p className="text-gray-300">
              See how much your household really spends every year.
            </p>
          </div>

          <a
            href="/dashboard"
            className="mt-6 md:mt-0 bg-white text-black px-8 py-4 rounded-2xl font-bold"
          >
            Open Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}