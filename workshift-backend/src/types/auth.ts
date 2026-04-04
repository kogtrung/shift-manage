export type UserStatus = 'ACTIVE' | 'BANNED';
export type GlobalRole = 'USER' | 'ADMIN';

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  status: UserStatus;
  globalRole: GlobalRole;
};
