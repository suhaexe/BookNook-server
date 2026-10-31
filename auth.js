import { createRemoteJWKSet, jwtVerify } from "jose";

const base = process.env.AUTH_BASE_URL;
if (!base) throw new Error("Missing AUTH_BASE_URL in .env");

const JWKS = createRemoteJWKSet(new URL(`${base}/api/auth/jwks`));

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: base,
      audience: base,
    });

    req.user = payload; 
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}