import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333/api",
  // Necessário para que o cookie httpOnly de autenticação seja enviado/recebido
  // nas requisições. Substitui o uso de localStorage + header Authorization.
  withCredentials: true,
});
