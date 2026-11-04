export type UserRole = "user" | "hospital" | "admin";

export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";

export interface User {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  bloodGroup?: BloodGroup;

  location?: {
    latitude: number;
    longitude: number;
  };

  isActive: boolean;
  createdAt: Date;
}

export interface Hospital {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;

  location: {
    latitude: number;
    longitude: number;
  };

  isVerified: boolean;
  isActive: boolean;
}

export interface BloodInventory {
  id: string;
  hospitalId: string;
  bloodGroup: BloodGroup;
  availableUnits: number;
  lastUpdated: Date;
}

export interface BloodRequest {
  id: string;
  userId: string;
  hospitalId?: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  urgency: "normal" | "urgent" | "emergency";
  status: "pending" | "accepted" | "completed" | "cancelled";
  createdAt: Date;
}