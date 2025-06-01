import type { User } from "firebase/auth";

export const checkAdminClaim = async (user: User) => {
  const token = await user.getIdTokenResult();
  return Object.prototype.hasOwnProperty.call(token.claims, "admin");
};
