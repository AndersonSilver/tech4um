module.exports = async () => {
  try {
    const { disconnectRedis } = require("./src/config/redis");
    await disconnectRedis();
  } catch {
    // Ignora se o módulo não foi carregado nesta execução.
  }
};
