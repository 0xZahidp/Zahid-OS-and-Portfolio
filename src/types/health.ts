export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface DoctorContact {
  name: string;
  phone: string;
  clinic?: string;
}

export interface InsuranceInfo {
  provider: string;
  policyNo?: string;
  phone?: string;
}

export interface HealthProfile {
  bloodGroup?: string;
  allergies: string[];
  conditions: string[];
  emergencyContacts: EmergencyContact[];
  primaryDoctor?: DoctorContact;
  insurance?: InsuranceInfo;
  notes?: string;
  updatedAt?: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  schedule?: string;
  startDate?: string;
  endDate?: string;
  prescribedBy?: string;
  active: boolean;
  refillDate?: string;
  notes?: string;
  documentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type HealthDocumentCategory =
  | 'prescription'
  | 'lab'
  | 'imaging'
  | 'vaccination'
  | 'insurance'
  | 'other';

export interface HealthDocument {
  id: string;
  title: string;
  category: HealthDocumentCategory;
  date: string;
  doctor?: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Visit {
  id: string;
  date: string;
  doctor: string;
  reason: string;
  diagnosis?: string;
  notes?: string;
  followUpDate?: string;
  documentIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type VitalType = 'weight' | 'bp' | 'sugar' | 'heartRate' | 'temperature' | 'custom';

export interface Vital {
  id: string;
  date: string;
  type: VitalType;
  value: number;
  value2?: number; // Diastolic for blood pressure
  unit: string;
  label?: string; // For custom vitals
  note?: string;
  createdAt?: string;
}

export interface Vaccination {
  id: string;
  name: string;
  date?: string;
  nextDueDate?: string;
  notes?: string;
  createdAt?: string;
}

export type ReminderKind = 'refill' | 'followUp' | 'checkup' | 'vaccination' | 'custom';

export interface Reminder {
  id: string;
  title: string;
  dueDate: string;
  kind: ReminderKind;
  done: boolean;
  relatedId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HealthData {
  profile: HealthProfile;
  medications: Medication[];
  documents: HealthDocument[];
  visits: Visit[];
  vitals: Vital[];
  vaccinations: Vaccination[];
  reminders: Reminder[];
  lastBackupDate?: string;
}

export type HealthCollectionKey =
  | 'profile'
  | 'medications'
  | 'documents'
  | 'visits'
  | 'vitals'
  | 'vaccinations'
  | 'reminders';

export interface HealthCollections {
  profile: HealthProfile;
  medications: Medication[];
  documents: HealthDocument[];
  visits: Visit[];
  vitals: Vital[];
  vaccinations: Vaccination[];
  reminders: Reminder[];
}

export interface HealthStorageUsage {
  totalBytes: number;
  fileCount: number;
  limitBytes: number;
}

