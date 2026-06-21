import "reflect-metadata";
import dotenv from "dotenv";
import { AppDataSource } from "../config/data-source";
import { Forum } from "../entities/Forum";
import { ForumParticipant } from "../entities/ForumParticipant";
import { Message } from "../entities/Message";
import { MessageReaction } from "../entities/MessageReaction";
import { User } from "../entities/User";
import { getOrCreateDemoOwner, seedTechForums } from "../services/DemoDataSeeder";
import { TECH_FORUMS } from "./tech-forums-data";

dotenv.config();

async function resolveOwner(userRepo: ReturnType<typeof AppDataSource.getRepository<User>>) {
  const anderson =
    (await userRepo.findOne({ where: { username: "Anderson Silveira" } })) ??
    (await userRepo
      .createQueryBuilder("user")
      .where("LOWER(user.username) LIKE :name", { name: "%anderson%" })
      .getOne());

  if (anderson) return anderson;

  return getOrCreateDemoOwner(AppDataSource);
}

async function resetForums() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const forumRepo = AppDataSource.getRepository(Forum);
  const participantRepo = AppDataSource.getRepository(ForumParticipant);
  const messageRepo = AppDataSource.getRepository(Message);
  const reactionRepo = AppDataSource.getRepository(MessageReaction);

  const owner = await resolveOwner(userRepo);

  const existingForums = await forumRepo.find({ select: ["id", "name"] });
  console.log(`Apagando ${existingForums.length} salas existentes...`);

  await reactionRepo.createQueryBuilder().delete().execute();
  await messageRepo.createQueryBuilder().delete().execute();
  await participantRepo.createQueryBuilder().delete().execute();
  await forumRepo.createQueryBuilder().delete().execute();

  console.log(`Criando ${TECH_FORUMS.length} salas de tecnologia para ${owner.username}...`);

  const created = await seedTechForums(AppDataSource, owner);

  for (const forumData of TECH_FORUMS) {
    console.log(`  ✓ ${forumData.name}`);
  }

  console.log(`\nConcluído! ${created} salas ativas no dashboard.`);

  await AppDataSource.destroy();
}

resetForums().catch((error) => {
  console.error("Falha ao resetar salas:", error);
  process.exit(1);
});
