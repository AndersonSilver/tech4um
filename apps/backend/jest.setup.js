// Garante que os testes tenham as variáveis de ambiente obrigatórias,
// mesmo quando rodados localmente sem um .env configurado.
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_minimo_16_chars";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";
