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
  createdAt: Date;
  updatedAt: Date;
}
