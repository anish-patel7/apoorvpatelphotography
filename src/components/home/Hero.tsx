import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      setTimeout(() => el.classList.add('visible'), 100);
    }
  }, []);

  return (
    <header className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPb5GeAIOP94_pbGqYzTxKRiAPffukqGXDpjv0iQ2JuBMUTg7aMZkRLlHgNX3VKyKJtg_6-uLVp0_bRzFR3SS2B8azWS5Xn-Ej_-t6qr6P0BPv-f9PBMYv2daJQf2y3Pkgx447cefm5WJUc5xe9q8Q2H-zPIinL3MFjk4fu2e7BTmUvkcC3EUOIwGbz7sjdnuDjXNNynQ6T25oiR9qUGhmsgss-uwVY6qxC7nYCYhztU-SVHKX0WyK"
          alt="Cinematic landscape at dawn"
          className="w-full h-full object-cover opacity-60"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
      </div>

      <div
        ref={ref}
        className="relative z-10 text-center px-5 flex flex-col items-center gap-6 max-w-4xl mt-20 fade-in"
      >
        <h1 className="font-display text-[32px] md:text-[72px] text-on-background leading-[1.1] tracking-[-0.02em] font-semibold">
          Apoorvpatel Photography
        </h1>
        <p className="font-body text-[18px] text-on-surface-variant italic tracking-wide">
          "inspired by innovation"
        </p>
        <div className="flex flex-col sm:flex-row gap-6 mt-8">
          <Link
            to="/portfolio"
            className="bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] px-8 py-4 rounded-full btn-cinematic hover:bg-tertiary hover:text-on-tertiary border border-on-background transition-colors"
          >
            View Portfolio
          </Link>
          <Link
            to="/contact"
            className="bg-transparent text-on-background font-body text-[14px] font-semibold tracking-[0.05em] px-8 py-4 rounded-full btn-cinematic border border-on-background hover:bg-on-background hover:text-background transition-colors"
          >
            Get a Quote
          </Link>
        </div>
      </div>
    </header>
  );
}
