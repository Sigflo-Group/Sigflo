import { motion } from 'framer-motion';
import { HeroBackground } from '@/components/landing/hero/HeroBackground';
import { HeroLiveTickerStrip } from '@/components/landing/hero/HeroLiveTickerStrip';
import { HeroNavBar, scrollToLandingId } from '@/components/landing/HeroNavBar';
import { LandingPrimaryCta, LandingSecondaryCta } from '@/components/landing/LandingCta';
import { LANDING_SECTIONS } from '@/components/landing/landingSections';

const HERO_PHONE_SRC = `${import.meta.env.BASE_URL}landing-hero-phone.png`;

const rise = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

type Props = {
  embedNav: boolean;
};

export function HeroSection({ embedNav }: Props) {
  return (
    <section
      id="top"
      className="relative flex min-h-[92vh] flex-col overflow-hidden bg-[#0c0e12] text-[#F5F7FA] antialiased"
    >
      {/* Background stack: scene + tint toward landing-bg + tall handoff (incl. last trace of hero green). */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <HeroBackground />
        {/* Mid-to-bottom wash: nudges whole lower hero toward page chrome without a visible band */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, transparent 42%, rgba(15, 17, 21, 0.12) 72%, rgba(15, 17, 21, 0.38) 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 z-[2] h-[clamp(7rem,22vh,13rem)] sm:h-[clamp(8rem,26vh,15rem)]"
          style={{
            background: `
              linear-gradient(to top,
                #0F1115 0%,
                rgba(15, 17, 21, 0.97) 18%,
                rgba(15, 17, 21, 0.72) 42%,
                rgba(12, 14, 18, 0.35) 68%,
                rgba(0, 200, 120, 0.028) 88%,
                transparent 100%
              )
            `,
          }}
        />
      </div>

      {embedNav ? (
        <div className="sticky top-0 z-30 shrink-0">
          <HeroNavBar variant="hero" />
        </div>
      ) : null}

      <div className="relative z-[1] mx-auto w-full max-w-[1280px] shrink-0 px-4 pt-3 sm:px-6 sm:pt-4 lg:px-8">
        <HeroLiveTickerStrip />
      </div>

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-center py-8 sm:py-10 lg:py-6">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-10 px-4 sm:gap-12 sm:px-6 lg:grid-cols-[46%_54%] lg:gap-8 lg:px-8 xl:gap-12">
          <div className="min-w-0 lg:py-2">
            <motion.p
              {...rise}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#00C878] sm:mb-5 sm:text-xs sm:tracking-[0.26em]"
            >
              Trading signals / AI-assisted
            </motion.p>
            <motion.h1
              {...rise}
              transition={{ duration: 0.48, delay: 0.03, ease: [0.22, 1, 0.36, 1] }}
              className="text-[1.875rem] font-semibold leading-[1.12] tracking-tight sm:text-[2.125rem] lg:text-[2.5rem] lg:leading-[1.1] xl:text-[2.75rem]"
            >
              Sigflo — The Smarter Way to Trade
            </motion.h1>
            <motion.p
              {...rise}
              transition={{ duration: 0.48, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 max-w-[28rem] text-base leading-relaxed text-[rgba(245,247,250,0.72)] sm:text-lg"
            >
              AI-assisted signals, cleaner entries, and smarter exits — all in one trading interface.
            </motion.p>
            <motion.div
              {...rise}
              transition={{ duration: 0.48, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-wrap items-center gap-3 sm:mt-9"
            >
              <LandingPrimaryCta
                pulseIdle
                onClick={() => scrollToLandingId(LANDING_SECTIONS.joinWaitlist)}
                className="px-7 py-3.5 text-[0.9375rem]"
              >
                Join Waitlist
              </LandingPrimaryCta>
              <LandingSecondaryCta
                onClick={() => scrollToLandingId(LANDING_SECTIONS.screens)}
                className="border-[rgba(130,170,190,0.22)] bg-[rgba(14,20,28,0.55)] px-7 py-3.5 text-[0.9375rem] backdrop-blur-md hover:border-[rgba(130,170,190,0.32)] hover:bg-[rgba(14,20,28,0.72)]"
              >
                View Screens
              </LandingSecondaryCta>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.22 }}
              className="mt-7 text-sm text-[rgba(245,247,250,0.55)]"
            >
              Built for active traders — no hype, no noise.
            </motion.p>
          </div>

          <div className="flex min-w-0 justify-center lg:justify-end lg:pl-2">
            <motion.figure
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative isolate m-0 w-full max-w-[min(100%,520px)] lg:max-w-[min(100%,600px)]"
            >
              <img
                src={HERO_PHONE_SRC}
                alt="Sigflo app on a phone with bots command center, floating trend charts, and green glow accents on a dark background."
                width={682}
                height={1024}
                decoding="async"
                fetchPriority="high"
                className="mx-auto h-auto w-full max-h-[min(78vh,700px)] object-contain [filter:drop-shadow(0_32px_64px_rgba(0,0,0,0.38))_drop-shadow(0_12px_36px_rgba(0,0,0,0.22))] motion-reduce:[filter:drop-shadow(0_20px_48px_rgba(0,0,0,0.35))]"
              />
            </motion.figure>
          </div>
        </div>
      </div>
    </section>
  );
}
