'use client';

import { useEffect, useState } from 'react';

interface ConfettiProps {
  show: boolean;
}

export default function Confetti({ show }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    if (show) {
      // Créer 20 particules de confettis avec positions et timings aléatoires
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 1 + Math.random() * 0.5,
      }));
      setParticles(newParticles);

      // Nettoyer après 2 secondes
      const timer = setTimeout(() => {
        setParticles([]);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute top-0 animate-confetti"
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][
                Math.floor(Math.random() * 5)
              ],
            }}
          />
        </div>
      ))}
    </div>
  );
}
