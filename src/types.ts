export type Tenant = {
  id: string;
  slug: string;
  name: string;
  type: 'salon' | 'clinic' | 'barbershop' | 'barber' | 'studio' | 'other';
  status: 'trial' | 'active' | 'inactive' | 'past_due';
  plan: 'standard' | 'pro';
  trialEndsAt?: string;
  createdAt: string;
  ownerId: string;
};

export type Service = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
};

export type Professional = {
  id: string;
  tenantId: string;
  name: string;
  role: string;
  avatar: string;
  serviceIds: string[]; // which services they can perform
  workingDays?: number[];
};

export type Appointment = {
  id: string;
  serviceId: string;
  professionalId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
};

export type BookingState = {
  step: number;
  serviceId: string | null;
  professionalId: string | null;
  date: string | null;
  time: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
};
