export const ROLES = { ADMIN: 'admin', HOSPITAL: 'hospital', AGENT: 'agent', CUSTOMER: 'customer' };

export const TRIP_TYPES = { PREHOSPITAL: 'prehospital', H2H: 'h2h', DISCHARGE: 'discharge' };

export const TRIP_STATUS = {
  PENDING: 'pending', ACCEPTED: 'accepted', ENROUTE: 'enroute',
  COMPLETED: 'completed', CANCELLED: 'cancelled',
};

export const BOOKING_TYPES = { OPD: 'opd', SURGERY: 'surgery', CONSULTATION: 'consultation' };

export const BOOKING_STATUS = {
  PENDING: 'pending', CONFIRMED: 'confirmed', COMPLETED: 'completed', CANCELLED: 'cancelled',
};

export const DIAG_STATUS = {
  PENDING: 'pending', CONFIRMED: 'confirmed', SAMPLE_COLLECTED: 'sample_collected',
  REPORT_READY: 'report_ready', COMPLETED: 'completed', CANCELLED: 'cancelled',
};

export const FARE = {
  ALS_BASE: 4500, ALS_PER_KM: 120,
  BLS_BASE: 2500, BLS_PER_KM: 60,
  H2H_BASE: 5000, H2H_PER_KM: 130,
};

export const MADURAI_CENTER    = [9.9252, 78.1198];
export const COIMBATORE_CENTER = [11.0168, 76.9558];

export const AMBULANCE_ZONES = [
  { id: 'A1', name: 'KK Nagar - Apollo',  lat: 9.928,  lng: 78.149, status: 'available' },
  { id: 'A2', name: 'Meenakshi Mission',  lat: 9.948,  lng: 78.163, status: 'available' },
  { id: 'A3', name: 'Rajaji Hospital',    lat: 9.928,  lng: 78.130, status: 'on_call'   },
  { id: 'A4', name: 'Mattuthavani',       lat: 9.943,  lng: 78.156, status: 'available' },
  { id: 'A5', name: 'Velammal South',     lat: 9.887,  lng: 78.150, status: 'available' },
];

// Status badge colors (Tailwind classes)
export const STATUS_COLORS = {
  pending:              'bg-amber-100 text-amber-700 border-amber-200',
  confirmed:            'bg-teal-100 text-teal-700 border-teal-200',
  accepted:             'bg-blue-100 text-blue-700 border-blue-200',
  enroute:              'bg-purple-100 text-purple-700 border-purple-200',
  completed:            'bg-green-100 text-green-700 border-green-200',
  cancelled:            'bg-red-100 text-red-700 border-red-200',
  on_call:              'bg-amber-100 text-amber-700 border-amber-200',
  available:            'bg-green-100 text-green-700 border-green-200',
  maintenance:          'bg-red-100 text-red-700 border-red-200',
  offline:              'bg-slate-100 text-slate-500 border-slate-200',
  sample_collected:     'bg-blue-100 text-blue-700 border-blue-200',
  report_ready:         'bg-indigo-100 text-indigo-700 border-indigo-200',
  converted:            'bg-green-100 text-green-700 border-green-200',
  contacted:            'bg-blue-100 text-blue-700 border-blue-200',
  lost:                 'bg-red-100 text-red-700 border-red-200',
  ambulance_dispatched: 'bg-purple-100 text-purple-700 border-purple-200',
  in_transit:           'bg-amber-100 text-amber-700 border-amber-200',
};

// Fare calculation
export function calcFare(type, distKm) {
  const d = parseFloat(distKm) || 10;
  const extra = Math.max(0, d - 10);
  if (type === 'h2h')       return FARE.H2H_BASE + extra * FARE.H2H_PER_KM;
  if (type === 'discharge') return FARE.BLS_BASE + extra * FARE.BLS_PER_KM;
  return FARE.ALS_BASE + extra * FARE.ALS_PER_KM;
}

// MedRush score helpers
export function medrushScoreColor(score) {
  if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 80) return 'text-teal-600 bg-teal-50 border-teal-200';
  if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

export function medrushScoreLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  return 'Average';
}

// Haversine distance in km
export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}
