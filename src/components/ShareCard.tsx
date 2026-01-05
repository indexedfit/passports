import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { useAppStore } from '../stores/appStore';
import { CountUpNumber } from './CountUpNumber';

// Get flag emoji from ISO2 code
function getFlagEmoji(iso2: string): string {
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function ShareCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const { selectedPassports, combinedVisaAccess, topSynergies } = useAppStore();

  if (selectedPassports.length === 0) return null;

  const totalVisaFree = combinedVisaAccess.total.size;
  const topSynergy = topSynergies[0];

  const handleDownload = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `passport-synergy-${selectedPassports.map((p) => p.iso2).join('-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Share button - top right on mobile (panel is bottom sheet), left of panel on desktop */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setShowModal(true)}
        className="fixed top-4 right-4 md:top-auto md:bottom-6 md:right-[420px] z-30 flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        Share
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full"
            >
              {/* Preview card */}
              <div
                ref={cardRef}
                className="p-8 bg-gradient-to-br from-blue-50 via-white to-emerald-50"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Passport Synergy
                  </h2>
                  <p className="text-gray-500 text-sm">Your ideal citizenship combo</p>
                </div>

                {/* Passports */}
                <div className="flex justify-center gap-4 mb-6">
                  {selectedPassports.map((passport) => (
                    <div
                      key={passport.iso3}
                      className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100"
                    >
                      <span className="text-4xl">{getFlagEmoji(passport.iso2)}</span>
                      <span className="font-medium text-gray-900">{passport.name}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {totalVisaFree > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        <CountUpNumber value={totalVisaFree} />
                      </div>
                      <div className="text-sm text-gray-500">Visa-free countries</div>
                    </div>
                  )}
                  {topSynergy && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                      <div className="text-3xl font-bold text-emerald-600">
                        <CountUpNumber value={topSynergy.synergy.score} />
                      </div>
                      <div className="text-sm text-gray-500">Top synergy score</div>
                    </div>
                  )}
                </div>

                {/* Top recommendation */}
                {topSynergy && selectedPassports.length === 1 && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 mb-2">Best pairing</div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFlagEmoji(topSynergy.iso2)}</span>
                      <div>
                        <div className="font-medium text-gray-900">{topSynergy.name}</div>
                        <div className="text-sm text-emerald-600">
                          {topSynergy.synergy.score} synergy score
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-6 text-center text-xs text-gray-400">
                  passportsynergy.app
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
