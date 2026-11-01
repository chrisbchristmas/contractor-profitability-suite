// Regional loaded labour rate defaults by US region and trade
// Rates are typical fully-loaded hourly rates ($/hr) for each trade in each region

export const REGIONAL_RATES = {
  Northeast: {
    states: ["CT", "MA", "ME", "NH", "NY", "RI", "VT"],
    rates: { "General Contractor": 85, Painting: 65, Roofing: 75, HVAC: 95, Electrical: 90, Plumbing: 95 },
  },
  "Mid-Atlantic": {
    states: ["DC", "DE", "MD", "NJ", "PA"],
    rates: { "General Contractor": 80, Painting: 62, Roofing: 72, HVAC: 90, Electrical: 85, Plumbing: 90 },
  },
  Southeast: {
    states: ["AL", "AR", "FL", "GA", "KY", "LA", "MS", "NC", "SC", "TN", "VA", "WV"],
    rates: { "General Contractor": 65, Painting: 50, Roofing: 58, HVAC: 72, Electrical: 70, Plumbing: 72 },
  },
  Midwest: {
    states: ["IA", "IL", "IN", "MI", "MN", "MO", "ND", "NE", "OH", "SD", "WI", "KS"],
    rates: { "General Contractor": 70, Painting: 55, Roofing: 62, HVAC: 78, Electrical: 75, Plumbing: 78 },
  },
  Southwest: {
    states: ["AZ", "NM", "OK", "TX"],
    rates: { "General Contractor": 68, Painting: 52, Roofing: 60, HVAC: 75, Electrical: 72, Plumbing: 75 },
  },
  Mountain: {
    states: ["CO", "ID", "MT", "NV", "UT", "WY"],
    rates: { "General Contractor": 72, Painting: 57, Roofing: 65, HVAC: 80, Electrical: 77, Plumbing: 80 },
  },
  Pacific: {
    states: ["AK", "CA", "HI", "OR", "WA"],
    rates: { "General Contractor": 95, Painting: 75, Roofing: 85, HVAC: 105, Electrical: 100, Plumbing: 105 },
  },
};

export const US_STATES = [
  { code: "AL", name: "Alabama", region: "Southeast" },
  { code: "AK", name: "Alaska", region: "Pacific" },
  { code: "AZ", name: "Arizona", region: "Southwest" },
  { code: "AR", name: "Arkansas", region: "Southeast" },
  { code: "CA", name: "California", region: "Pacific" },
  { code: "CO", name: "Colorado", region: "Mountain" },
  { code: "CT", name: "Connecticut", region: "Northeast" },
  { code: "DE", name: "Delaware", region: "Mid-Atlantic" },
  { code: "DC", name: "District of Columbia", region: "Mid-Atlantic" },
  { code: "FL", name: "Florida", region: "Southeast" },
  { code: "GA", name: "Georgia", region: "Southeast" },
  { code: "HI", name: "Hawaii", region: "Pacific" },
  { code: "ID", name: "Idaho", region: "Mountain" },
  { code: "IL", name: "Illinois", region: "Midwest" },
  { code: "IN", name: "Indiana", region: "Midwest" },
  { code: "IA", name: "Iowa", region: "Midwest" },
  { code: "KS", name: "Kansas", region: "Midwest" },
  { code: "KY", name: "Kentucky", region: "Southeast" },
  { code: "LA", name: "Louisiana", region: "Southeast" },
  { code: "ME", name: "Maine", region: "Northeast" },
  { code: "MD", name: "Maryland", region: "Mid-Atlantic" },
  { code: "MA", name: "Massachusetts", region: "Northeast" },
  { code: "MI", name: "Michigan", region: "Midwest" },
  { code: "MN", name: "Minnesota", region: "Midwest" },
  { code: "MS", name: "Mississippi", region: "Southeast" },
  { code: "MO", name: "Missouri", region: "Midwest" },
  { code: "MT", name: "Montana", region: "Mountain" },
  { code: "NE", name: "Nebraska", region: "Midwest" },
  { code: "NV", name: "Nevada", region: "Mountain" },
  { code: "NH", name: "New Hampshire", region: "Northeast" },
  { code: "NJ", name: "New Jersey", region: "Mid-Atlantic" },
  { code: "NM", name: "New Mexico", region: "Southwest" },
  { code: "NY", name: "New York", region: "Northeast" },
  { code: "NC", name: "North Carolina", region: "Southeast" },
  { code: "ND", name: "North Dakota", region: "Midwest" },
  { code: "OH", name: "Ohio", region: "Midwest" },
  { code: "OK", name: "Oklahoma", region: "Southwest" },
  { code: "OR", name: "Oregon", region: "Pacific" },
  { code: "PA", name: "Pennsylvania", region: "Mid-Atlantic" },
  { code: "RI", name: "Rhode Island", region: "Northeast" },
  { code: "SC", name: "South Carolina", region: "Southeast" },
  { code: "SD", name: "South Dakota", region: "Midwest" },
  { code: "TN", name: "Tennessee", region: "Southeast" },
  { code: "TX", name: "Texas", region: "Southwest" },
  { code: "UT", name: "Utah", region: "Mountain" },
  { code: "VT", name: "Vermont", region: "Northeast" },
  { code: "VA", name: "Virginia", region: "Southeast" },
  { code: "WA", name: "Washington", region: "Pacific" },
  { code: "WV", name: "West Virginia", region: "Southeast" },
  { code: "WI", name: "Wisconsin", region: "Midwest" },
  { code: "WY", name: "Wyoming", region: "Mountain" },
];

// Maps trade preset names to the keys used in REGIONAL_RATES
const TRADE_TO_REGIONAL_KEY = {
  "General Contractor": "General Contractor",
  Painting: "Painting",
  Roofing: "Roofing",
  HVAC: "HVAC",
  Electrical: "Electrical",
  Plumbing: "Plumbing",
};

// Maps Customer.trade enum values to regional rate keys
const TRADE_ENUM_TO_KEY = {
  Roofing: "Roofing",
  Painting: "Painting",
  Electrical: "Electrical",
  Plumbing: "Plumbing",
  HVAC: "HVAC",
  "General Carpentry/Remodeling": "General Contractor",
  Flooring: "General Contractor",
  "Landscaping/Hardscape": "General Contractor",
  Concrete: "General Contractor",
};

export function getRegionForState(stateCode) {
  if (!stateCode) return null;
  const state = US_STATES.find((s) => s.code === stateCode);
  return state?.region || null;
}

export function getRegionalRate(stateCode, tradePreset) {
  if (!stateCode) return null;
  const region = getRegionForState(stateCode);
  if (!region) return null;
  const regionData = REGIONAL_RATES[region];
  if (!regionData) return null;
  const rateKey = TRADE_TO_REGIONAL_KEY[tradePreset] || TRADE_ENUM_TO_KEY[tradePreset];
  if (!rateKey) return null;
  return regionData.rates[rateKey] || null;
}