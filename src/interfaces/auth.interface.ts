export interface LoginBody {
  emailId: string;
  password: string;
}

export interface SignupBody {
  firstName: string;
  lastName: string;
  emailId: string;
  password: string;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  dob?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UpdateUserDto = Partial<Omit<AuthUser, "id" | "email">>;
