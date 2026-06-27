import type { PricingPlan } from "../../types/pricing";

const tones = ["soft", "featured", "warm"];

export function PricingCard({ plan, index = 0 }: { plan: PricingPlan; index?: number }) {
  const tone = tones[index % tones.length];

  return (
    <article className={`pricing-card pricing-${tone}`}>
      <div className="pricing-card-glow" aria-hidden="true"></div>
      <div className="pricing-head">
        <div className="pricing-icon" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span className="pricing-badge">{plan.subtitle || "Offre"}</span>
      </div>
      <h3>{plan.title}</h3>
      <p>{plan.description}</p>
      <strong>{plan.priceLabel}</strong>
      <ul className="pricing-features">
        {plan.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </article>
  );
}
