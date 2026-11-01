export const TRADE_PRESETS = {
  "General Contractor": { overhead: 15, material_markup: 20, workers_comp: 8, profit_target: 20 },
  "Painting": { overhead: 12, material_markup: 25, workers_comp: 10, profit_target: 20 },
  "Roofing": { overhead: 18, material_markup: 30, workers_comp: 15, profit_target: 20 },
  "HVAC": { overhead: 20, material_markup: 35, workers_comp: 8, profit_target: 20 },
  "Electrical": { overhead: 18, material_markup: 30, workers_comp: 8, profit_target: 20 },
  "Plumbing": { overhead: 20, material_markup: 35, workers_comp: 8, profit_target: 20 },
};

export const TRADE_PRESET_OPTIONS = Object.keys(TRADE_PRESETS);

export function getTradePreset(tradeName) {
  return TRADE_PRESETS[tradeName] || null;
}