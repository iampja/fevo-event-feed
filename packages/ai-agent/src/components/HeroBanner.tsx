import React from 'react';

const HeroBanner: React.FC = () => {
  return (
    <div
      className="px-6 py-12 text-center"
      style={{ background: 'linear-gradient(135deg, #FCD205 0%, #e3bc04 100%)' }}
    >
      <h1 className="text-[32px] font-bold tracking-tight text-black mb-2">
        Launch Your Event in Seconds
      </h1>
      <p className="text-lg text-black/80 mb-4">
        Tickets, registrations, or event series — just describe it
      </p>
      <span className="inline-block bg-black/10 text-black text-sm px-4 py-1.5 rounded-pill font-medium">
        ⚡ Free: 5 active events + 20/year &bull; Pro: Unlimited
      </span>
    </div>
  );
};

export default HeroBanner;
