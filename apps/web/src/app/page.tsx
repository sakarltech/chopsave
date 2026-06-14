export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-chopsave-600 text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">ChopSave 🍛</h1>
        <p className="text-xl md:text-2xl mb-2">Chop Well. Waste Nothing.</p>
        <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
          Rescue surplus food from nearby restaurants, bakeries, and food businesses at 50-75% off. Lagos & Abuja.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="/login" className="bg-white text-chopsave-700 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-gray-100">Find Food Near You</a>
          <a href="/business/register" className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-white/10">List Your Business</a>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-xl font-semibold mb-2">Discover</h3>
            <p className="text-gray-600">Find surplus food from businesses near you at huge discounts</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-semibold mb-2">Reserve & Pay</h3>
            <p className="text-gray-600">Reserve your meal and pay securely with card, bank transfer, or USSD</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold mb-2">Collect</h3>
            <p className="text-gray-600">Show your pickup code at the business and enjoy your food!</p>
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="bg-white py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Now in Lagos & Abuja</h2>
        <p className="text-gray-600 text-lg">More Nigerian cities coming soon</p>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6 text-center">
        <p className="text-sm opacity-70">© 2024 ChopSave. Reducing food waste across Nigeria.</p>
      </footer>
    </main>
  );
}
