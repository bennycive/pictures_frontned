import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { siteApi } from '../../api';
import type { ArtistProfile, Exhibition } from '../../api/types';

const DEFAULT_PROFILE: ArtistProfile = {
  name: 'Beatha Theonest',
  location: 'Arusha, Tanzania',
  photo_url: null,
  biography: 'Beatha Theonest is a contemporary African artist whose work explores the intersection of traditional African aesthetics and modern expression. Her paintings and mixed-media works have been exhibited across East Africa and internationally.',
  story: 'Growing up surrounded by the vibrant landscapes of Arusha, Beatha developed an early fascination with color, texture, and the stories embedded in everyday life. She studied fine arts at the Dar es Salaam Institute of Arts before establishing her studio practice.\n\nOver the years, her work has evolved into a distinctive visual language that draws on Tanzanian cultural heritage while engaging with contemporary global dialogues. Each piece is an exploration — of identity, belonging, and the enduring beauty of the African experience.',
  philosophy: 'Art is not merely what you see but what you feel. I create to bridge worlds — to bring the soul of Africa into spaces where it can be felt, understood, and celebrated. Every brushstroke carries a story that transcends borders.',
  statement: 'My work is rooted in the belief that African art belongs on the world stage — not as an exotic curiosity, but as a powerful, sophisticated voice in the global conversation. Through my practice, I seek to elevate and preserve the visual narratives of our continent for generations to come.',
  updated_at: '',
};

export function AboutPage() {
  const [profile, setProfile] = useState<ArtistProfile>(DEFAULT_PROFILE);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);

  useEffect(() => {
    siteApi.getArtistProfile()
      .then(res => setProfile(res.data))
      .catch(() => {});
    siteApi.listExhibitions()
      .then(res => setExhibitions(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#f5ede0] py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-earth-500 dark:text-earth-400 mb-4">The Artist</p>
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl mb-5 text-earth-900 dark:text-white leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 400 }}
          >
            {profile.name}
          </h1>
          <div className="flex items-center justify-center gap-1.5 text-earth-500 dark:text-earth-400 text-sm">
            <MapPin size={15} className="text-primary-500" />
            <span>{profile.location}</span>
          </div>
        </div>
      </section>

      {/* Photo + Bio + Story */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Photo with decorative frame */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              {/* Decorative corner frame */}
              <div className="absolute -top-3 -left-3 w-24 h-24 border-t-4 border-l-4 border-primary-500 rounded-tl-sm z-10" />
              <div className="absolute -bottom-3 -right-3 w-24 h-24 border-b-4 border-r-4 border-primary-500 rounded-br-sm z-10" />
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.name}
                  className="w-72 h-80 sm:w-80 sm:h-96 object-cover relative z-0"
                />
              ) : (
                <div className="w-72 h-80 sm:w-80 sm:h-96 bg-earth-200 flex items-center justify-center relative z-0">
                  <span className="text-earth-400 text-sm">Artist Photo</span>
                </div>
              )}
            </div>
          </div>

          {/* Biography + My Story */}
          <div className="space-y-10">
            {/* Biography */}
            <div>
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-primary-600 mb-4">Biography</h2>
              <p className="text-earth-700 leading-relaxed">{profile.biography}</p>
            </div>

            {/* My Story */}
            <div>
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-primary-600 mb-4">My Story</h2>
              <div className="space-y-4">
                {profile.story.split('\n\n').filter(Boolean).map((para, i) => (
                  <p key={i} className="text-earth-700 leading-relaxed">{para}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Artistic Philosophy */}
      {profile.philosophy && (
        <section className="bg-earth-50 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-primary-600 mb-8">Artistic Philosophy</h2>
            <blockquote className="border-l-4 border-primary-500 pl-6 py-1">
              <p className="text-earth-800 text-lg sm:text-xl leading-relaxed italic">
                "{profile.philosophy}"
              </p>
            </blockquote>
          </div>
        </section>
      )}

      {/* Artist Statement */}
      {profile.statement && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-primary-600 mb-6">Artist Statement</h2>
          <p className="text-earth-700 leading-relaxed text-base sm:text-lg">{profile.statement}</p>
        </section>
      )}

      {/* Career Highlights — Exhibitions */}
      {exhibitions.length > 0 && (
        <section className="bg-earth-50 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-primary-600 mb-2">Career Highlights</h2>
            <h3 className="text-2xl font-bold text-earth-900 mb-10">Exhibitions</h3>
            <div className="space-y-0 divide-y divide-earth-200">
              {exhibitions.map(ex => (
                <div key={ex.id} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 py-5">
                  <span className="shrink-0 text-sm font-bold text-primary-600 w-16">{ex.date_label}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-earth-900 text-sm sm:text-base">{ex.title}</p>
                    {ex.location && (
                      <p className="text-xs text-earth-500 mt-0.5 flex items-center gap-1">
                        <MapPin size={11} /> {ex.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="flex-1" />
      <Footer />
    </div>
  );
}
