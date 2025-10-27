// Unit Conversion Utilities
// All data is stored in metric (kg, cm, meters) and converted for display/input

export const UNIT_SYSTEMS = {
  METRIC: 'metric',
  IMPERIAL: 'imperial'
};

// Weight conversions
export const kgToLbs = (kg) => kg * 2.20462;
export const lbsToKg = (lbs) => lbs / 2.20462;

export const formatWeight = (kg, unitSystem) => {
  if (unitSystem === UNIT_SYSTEMS.IMPERIAL) {
    return `${kgToLbs(kg).toFixed(1)} lbs`;
  }
  return `${kg.toFixed(1)} kg`;
};

export const getWeightUnit = (unitSystem) => {
  return unitSystem === UNIT_SYSTEMS.IMPERIAL ? 'lbs' : 'kg';
};

export const convertWeightToMetric = (value, unitSystem) => {
  if (unitSystem === UNIT_SYSTEMS.IMPERIAL) {
    return lbsToKg(value);
  }
  return value;
};

export const convertWeightFromMetric = (kg, unitSystem) => {
  if (unitSystem === UNIT_SYSTEMS.IMPERIAL) {
    return kgToLbs(kg);
  }
  return kg;
};

// Height conversions
export const cmToInches = (cm) => cm / 2.54;
export const inchesToCm = (inches) => inches * 2.54;

export const cmToFeetAndInches = (cm) => {
  const totalInches = cmToInches(cm);
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};

export const feetAndInchesToCm = (feet, inches) => {
  const totalInches = (feet * 12) + inches;
  return inchesToCm(totalInches);
};

export const formatHeight = (cm, unitSystem) => {
  if (unitSystem === UNIT_SYSTEMS.IMPERIAL) {
    const { feet, inches } = cmToFeetAndInches(cm);
    return `${feet}'${inches}"`;
  }
  return `${cm.toFixed(0)} cm`;
};

export const getHeightUnit = (unitSystem) => {
  return unitSystem === UNIT_SYSTEMS.IMPERIAL ? 'ft/in' : 'cm';
};

// Body measurements (chest, waist, etc.)
export const cmToInchesSimple = (cm) => cm / 2.54;
export const inchesToCmSimple = (inches) => inches * 2.54;

export const formatMeasurement = (cm, unitSystem) => {
  if (unitSystem === UNIT_SYSTEMS.IMPERIAL) {
    return `${cmToInchesSimple(cm).toFixed(1)} in`;
  }
  return `${cm.toFixed(1)} cm`;
};

export const getMeasurementUnit = (unitSystem) => {
  return unitSystem === UNIT_SYSTEMS.IMPERIAL ? 'in' : 'cm';
};

export const convertMeasurementToMetric = (value, unitSystem) => {
  if (unitSystem === UNIT_SYSTEMS.IMPERIAL) {
    return inchesToCmSimple(value);
  }
  return value;
};

export const convertMeasurementFromMetric = (cm, unitSystem) => {
  if (unitSystem === UNIT_SYSTEMS.IMPERIAL) {
    return cmToInchesSimple(cm);
  }
  return cm;
};

// Distance conversions
export const DISTANCE_UNITS = {
  METERS: 'meters',
  KILOMETERS: 'kilometers',
  MILES: 'miles'
};

export const metersToMiles = (meters) => meters * 0.000621371;
export const milesToMeters = (miles) => miles / 0.000621371;
export const metersToKilometers = (meters) => meters / 1000;
export const kilometersToMeters = (km) => km * 1000;

export const formatDistance = (meters, unit) => {
  if (unit === DISTANCE_UNITS.MILES) {
    return `${metersToMiles(meters).toFixed(2)} mi`;
  }
  if (unit === DISTANCE_UNITS.KILOMETERS) {
    return `${metersToKilometers(meters).toFixed(2)} km`;
  }
  return `${meters.toFixed(0)} m`;
};

export const getDistanceUnit = (unit) => {
  if (unit === DISTANCE_UNITS.MILES) return 'mi';
  if (unit === DISTANCE_UNITS.KILOMETERS) return 'km';
  return 'm';
};

export const convertDistanceToMeters = (value, unit) => {
  if (unit === DISTANCE_UNITS.MILES) {
    return milesToMeters(value);
  }
  if (unit === DISTANCE_UNITS.KILOMETERS) {
    return kilometersToMeters(value);
  }
  return value;
};

export const convertDistanceFromMeters = (meters, unit) => {
  if (unit === DISTANCE_UNITS.MILES) {
    return metersToMiles(meters);
  }
  if (unit === DISTANCE_UNITS.KILOMETERS) {
    return metersToKilometers(meters);
  }
  return meters;
};

export const getDefaultDistanceUnit = (unitSystem) => {
  return unitSystem === UNIT_SYSTEMS.IMPERIAL ? DISTANCE_UNITS.MILES : DISTANCE_UNITS.METERS;
};