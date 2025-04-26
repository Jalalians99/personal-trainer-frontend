export interface Customer {
  id?: number;
  firstname: string;
  lastname: string;
  streetaddress: string;
  postcode: string;
  city: string;
  email: string;
  phone: string;
  links?: {
    self: { href: string };
    customer: { href: string };
    trainings: { href: string };
  };
}

export interface Training {
  id?: number;
  date: string;
  duration: number;
  activity: string;
  customer?: Customer;
  links?: {
    self: { href: string };
    training: { href: string };
    customer: { href: string };
  };
}

export interface CustomerResponse {
  _embedded: {
    customers: Customer[];
  };
  _links: {
    self: { href: string };
    profile: { href: string };
  };
}

export interface TrainingResponse {
  _embedded: {
    trainings: Training[];
  };
  _links: {
    self: { href: string };
    profile: { href: string };
  };
} 