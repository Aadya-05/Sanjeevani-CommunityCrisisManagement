export const INCIDENT_TYPES = [
  { value: 'fire', label: 'Fire', icon: '🔥', color: '#ef4444' },
  { value: 'flood', label: 'Flood', icon: '🌊', color: '#3b82f6' },
  { value: 'earthquake', label: 'Earthquake', icon: '🏚️', color: '#a16207' },
  { value: 'accident', label: 'Road Accident', icon: '🚗', color: '#f97316' },
  { value: 'medical_emergency', label: 'Medical Emergency', icon: '🚑', color: '#ec4899' },
  { value: 'crime', label: 'Crime', icon: '🚨', color: '#dc2626' },
  { value: 'riot', label: 'Riot / Civil Unrest', icon: '⚠️', color: '#b45309' },
  { value: 'gas_leak', label: 'Gas Leak', icon: '💨', color: '#6b7280' },
  { value: 'building_collapse', label: 'Building Collapse', icon: '🏗️', color: '#92400e' },
  { value: 'missing_person', label: 'Missing Person', icon: '🔍', color: '#7c3aed' },
  { value: 'child_abuse', label: 'Child in Danger', icon: '👶', color: '#be185d' },
  { value: 'domestic_violence', label: 'Domestic Violence', icon: '🏠', color: '#b91c1c' },
  { value: 'road_hazard', label: 'Road Hazard', icon: '🛑', color: '#d97706' },
  { value: 'power_outage', label: 'Power Outage', icon: '⚡', color: '#ca8a04' },
  { value: 'water_crisis', label: 'Water Crisis', icon: '💧', color: '#0284c7' },
  { value: 'epidemic', label: 'Epidemic / Disease', icon: '🦠', color: '#65a30d' },
  { value: 'chemical_spill', label: 'Chemical Spill', icon: '☣️', color: '#4d7c0f' },
  { value: 'stampede', label: 'Stampede', icon: '🏃', color: '#c2410c' },
  { value: 'terrorism', label: 'Terrorism / Blast', icon: '💥', color: '#991b1b' },
  { value: 'other', label: 'Other Emergency', icon: '🆘', color: '#6b7280' },
];

export const SEVERITY_COLORS = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-purple-600',
};

export const ROLES = [
  { value: 'civilian', label: 'Civilian / General Public' },
  { value: 'police', label: 'Police Officer' },
  { value: 'hospital', label: 'Hospital / Medical Staff' },
  { value: 'fire_department', label: 'Fire Department' },
  { value: 'ngo', label: 'NGO / Relief Organization' },
  { value: 'blood_donor', label: 'Blood Donor' },
  { value: 'volunteer', label: 'Volunteer' },
];

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];