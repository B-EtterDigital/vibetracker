# Pricing surface (versioned)

Credit/token → USD conversion tables, one file per provider. This is a **shared hot
path** (`pricing-surface`) because every USD estimate in the product derives from here.

Rules:
- Native units (credits/tokens/seconds) are the source of truth; USD is a labelled estimate.
- Each table is versioned with an effective date; rates change per plan/promo/model.
- Served to the CLI from the backend so credit→USD stays current without a CLI release.
- `⚠ VERIFY` every rate against the provider's current pricing before trusting it.
