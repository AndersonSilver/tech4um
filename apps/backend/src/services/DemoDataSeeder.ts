import { DataSource } from "typeorm";
import { Forum } from "../entities/Forum";
import { User } from "../entities/User";
import { PasswordHasher } from "../utils/PasswordHasher";
import { logger } from "../utils/logger";
import { DEMO_OWNER, TECH_FORUMS } from "../scripts/tech-forums-data";

export function shouldAutoSeedDemoData(): boolean {
  if (process.env.SEED_DEMO_DATA === "false") return false;
  if (process.env.NODE_ENV === "production") {
    return process.env.SEED_DEMO_DATA === "true";
  }
  return true;
}

export async function getOrCreateDemoOwner(dataSource: DataSource): Promise<User> {
  const userRepo = dataSource.getRepository(User);

  const existing = await userRepo.findOne({ where: { email: DEMO_OWNER.email } });
  if (existing) return existing;

  const passwordHash = await PasswordHasher.hash(DEMO_OWNER.password);

  const user = userRepo.create({
    username: DEMO_OWNER.username,
    email: DEMO_OWNER.email,
    passwordHash,
    isEmailVerified: true,
  });

  return userRepo.save(user);
}

export async function seedTechForums(
  dataSource: DataSource,
  owner: User
): Promise<number> {
  const forumRepo = dataSource.getRepository(Forum);

  let created = 0;

  for (const forumData of TECH_FORUMS) {
    const forum = forumRepo.create({
      name: forumData.name,
      description: forumData.description,
      ownerId: owner.id,
    });
    await forumRepo.save(forum);
    created += 1;
  }

  return created;
}

/**
 * Popula salas de demo na primeira execução (banco vazio).
 * Não exige login — cria o usuário demo diretamente no Postgres.
 */
export async function seedDemoDataIfNeeded(dataSource: DataSource): Promise<void> {
  if (!shouldAutoSeedDemoData()) return;

  const forumRepo = dataSource.getRepository(Forum);
  const existingCount = await forumRepo.count();
  if (existingCount > 0) return;

  const owner = await getOrCreateDemoOwner(dataSource);
  const created = await seedTechForums(dataSource, owner);

  logger.info(
    `🌱 Demo: ${created} salas criadas (owner: ${owner.username}). ` +
      `Login opcional para entrar no chat: ${DEMO_OWNER.email} / ${DEMO_OWNER.password}`
  );
}
