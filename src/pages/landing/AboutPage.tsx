import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Shield, Globe, Gavel, Users, Award, Heart } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-earth-50 dark:bg-earth-950 transition-colors duration-300 flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-earth-900 dark:bg-earth-950 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3">Our Story</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Celebrating African Art<br />
            <span className="text-primary-400">on the World Stage</span>
          </h1>
          <p className="text-earth-300 text-lg leading-relaxed">
            AfriStudio was founded with a single mission: to connect Africa's most talented digital artists
            with passionate collectors around the globe through transparent, real-time auctions.
          </p>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Heart,
              title: 'Our Mission',
              desc: 'Empower African artists by giving them a global platform to showcase and monetize their creativity, while connecting collectors with authentic, meaningful art.',
            },
            {
              icon: Globe,
              title: 'Our Vision',
              desc: 'A world where African art is celebrated, valued, and accessible to collectors everywhere — bridging cultures through creativity.',
            },
            {
              icon: Shield,
              title: 'Our Values',
              desc: 'Transparency in every transaction, authenticity in every artwork, and fairness for every artist. We build trust through technology.',
            },
          ].map(item => (
            <div key={item.title} className="bg-white dark:bg-earth-800 rounded-2xl border border-earth-100 dark:border-earth-700 p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 rounded-xl flex items-center justify-center mb-5">
                <item.icon size={24} className="text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-display font-bold text-xl text-earth-900 dark:text-earth-100 mb-3">{item.title}</h3>
              <p className="text-earth-500 dark:text-earth-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why AfriStudio */}
      <section className="bg-white dark:bg-earth-900/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-2">Why Us</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-earth-900 dark:text-earth-100">What Sets Us Apart</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Gavel, title: 'Real-Time Auctions', desc: 'Live bidding powered by WebSocket technology — every bid reflected instantly, no page refresh needed.' },
              { icon: Shield, title: 'Secure Payments', desc: 'Wallet-based payment system with escrow-style transfers. Your funds are protected at every step.' },
              { icon: Globe, title: 'Multi-Currency', desc: 'Browse and bid in your preferred currency. We support USD, TZS, KES, EUR, and more.' },
              { icon: Users, title: 'Artist Community', desc: 'A growing community of verified African artists from Kenya, Tanzania, Nigeria, Ghana, and beyond.' },
              { icon: Award, title: 'Curated Quality', desc: 'Every artwork is reviewed before listing. We maintain high standards so collectors can buy with confidence.' },
              { icon: Heart, title: 'African Heritage', desc: 'Rooted in the rich diversity of African culture — celebrating art from Nairobi to Lagos to Cape Town.' },
            ].map(f => (
              <div key={f.title} className="flex gap-4 p-6 bg-earth-50 dark:bg-earth-800 rounded-xl border border-earth-100 dark:border-earth-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                <div className="shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
                  <f.icon size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-earth-900 dark:text-earth-100 mb-1">{f.title}</h4>
                  <p className="text-sm text-earth-500 dark:text-earth-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { n: '500+', l: 'Artworks Listed' },
              { n: '1,200+', l: 'Collectors' },
              { n: '50+', l: 'Verified Artists' },
              { n: '12+', l: 'Countries' },
            ].map(s => (
              <div key={s.l} className="bg-white dark:bg-earth-800 rounded-2xl p-6 border border-earth-100 dark:border-earth-700">
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 font-display mb-1">{s.n}</p>
                <p className="text-xs text-earth-500 uppercase tracking-widest">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex-1" />
      <Footer />
    </div>
  );
}
