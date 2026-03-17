/** @jsxImportSource preact */

type CreateOfferCTAProps = {
  signupUrl?: string;
};

export function CreateOfferCTA({ signupUrl = 'https://www.gofevo.com' }: CreateOfferCTAProps) {
  return (
    <div class="fevo-ef-create-cta">
      <div class="fevo-ef-create-cta-content">
        <h3 class="fevo-ef-create-cta-title">Have an event?</h3>
        <p class="fevo-ef-create-cta-text">Create your offer and reach more fans with FEVO.</p>
      </div>
      <a class="fevo-ef-cta fevo-ef-create-cta-btn" href={signupUrl} target="_blank" rel="noopener noreferrer">
        Create Your Offer
      </a>
    </div>
  );
}
