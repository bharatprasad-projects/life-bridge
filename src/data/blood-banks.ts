
export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";

export interface BloodBank {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  distance: number;
  rating: number;
  verified: boolean;
  open: boolean;
  units: Record<BloodGroup, number>;
  phone: string;
  latitude: number;
  longitude: number;
}

export const bloodBanks: BloodBank[] = [
  {
    id: "demo-001",
    name: "Demo Medical Blood Centre",
    type: "Government Blood Bank",
    address: "Medical College Road",
    city: "Alappuzha",
    distance: 1.8,
    rating: 4.8,
    verified: true,
    open: true,
    units: {
      "A+": 8, "A-": 2, "B+": 5, "B-": 1,
      "AB+": 3, "AB-": 0, "O+": 12, "O-": 2,
    },
    phone: "",
    latitude: 9.4981,
    longitude: 76.3388,
  },
  {
    id: "demo-002",
    name: "Demo Lakeside Blood Centre",
    type: "Private Blood Bank",
    address: "Cherthala",
    city: "Alappuzha",
    distance: 4.3,
    rating: 4.6,
    verified: true,
    open: true,
    units: {
      "A+": 3, "A-": 1, "B+": 7, "B-": 0,
      "AB+": 2, "AB-": 1, "O+": 8, "O-": 1,
    },
    phone: "",
    latitude: 9.6842,
    longitude: 76.3351,
  },
  {
    id: "demo-003",
    name: "Demo City Care Blood Bank",
    type: "Hospital Blood Bank",
    address: "Town Centre",
    city: "Alappuzha",
    distance: 6.2,
    rating: 4.7,
    verified: true,
    open: false,
    units: {
      "A+": 4, "A-": 0, "B+": 6, "B-": 2,
      "AB+": 1, "AB-": 0, "O+": 9, "O-": 1,
    },
    phone: "",
    latitude: 9.4900,
    longitude: 76.3200,
  },
  {
    id: "demo-004",
    name: "Demo Community Blood Centre",
    type: "Private Blood Bank",
    address: "Ambalappuzha",
    city: "Alappuzha",
    distance: 9.5,
    rating: 4.5,
    verified: false,
    open: true,
    units: {
      "A+": 2, "A-": 0, "B+": 4, "B-": 1,
      "AB+": 0, "AB-": 0, "O+": 5, "O-": 0,
    },
    phone: "",
    latitude: 9.3860,
    longitude: 76.3690,
  },
];
