import rateLimit from "express-rate-limit";

// Login e registro: alvo clássico de brute-force / credential stuffing.
// 10 tentativas por IP em 15 minutos é generoso para uso legítimo,
// mas já corta automação simples.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas. Tente novamente em alguns minutos." },
});

// Limite mais generoso para o restante da API (proteção básica contra DoS simples).
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas requisições. Tente novamente em breve." },
});
