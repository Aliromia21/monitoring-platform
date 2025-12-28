export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type ApiError = {
  error?: {
    code?: string;
    message?: string;
  };
};
