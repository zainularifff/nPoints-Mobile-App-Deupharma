export type AuthUser = {
  id: string;
  name: string;
  role: string;
  email?: string;
  username?: string;
  department?: string;
  console_Idn?: number;
  menuIndex?: number;
  tenantId?: number;
  tenantCode?: string;
  tenantName?: string;
};

export type TwoFactorChallenge = {
  userId: number;
  tenantId: number;
  setupRequired: boolean;
  user: AuthUser;
  secret?: string;
  qrCode?: string;
  otpauthUrl?: string;
};

export type LoginResult =
  | {
      success: true;
      user: AuthUser;
      twoFactorRequired?: false;
    }
  | {
      success: true;
      twoFactorRequired: true;
      challenge: TwoFactorChallenge;
    }
  | {
      success: false;
      message: string;
    };
