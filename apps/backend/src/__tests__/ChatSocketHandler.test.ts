import { Server } from "socket.io";
import { createServer } from "http";
import { SOCKET_EVENTS } from "@tech4um/shared";
import { ChatSocketHandler } from "../sockets/ChatSocketHandler";
import { ForumRepository } from "../repositories/ForumRepository";

jest.mock("../services/MessageService");
jest.mock("../services/MessageReactionService");

describe("ChatSocketHandler", () => {
  let httpServer: ReturnType<typeof createServer>;
  let io: Server;

  afterEach(async () => {
    jest.restoreAllMocks();
    await new Promise<void>((resolve) => io.close(() => resolve()));
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it("entra na room e emite FORUM_JOINED antes de concluir o banco", async () => {
    httpServer = createServer();
    io = new Server(httpServer);
    const handler = new ChatSocketHandler(io);

    let resolveDb!: () => void;
    const dbGate = new Promise<string[]>((resolve) => {
      resolveDb = () => resolve([]);
    });

    jest.spyOn(ForumRepository.prototype, "setOfflineInOtherForums").mockReturnValue(dbGate);
    jest.spyOn(ForumRepository.prototype, "addParticipant").mockResolvedValue({} as never);
    jest.spyOn(ForumRepository.prototype, "setOnlineStatus").mockResolvedValue({} as never);

    const events: string[] = [];
    const mockSocket = {
      userId: "user-1",
      username: "Test",
      id: "socket-1",
      join: jest.fn((forumId: string) => {
        events.push(`join:${forumId}`);
      }),
      emit: jest.fn((event: string) => {
        events.push(`emit:${event}`);
      }),
      leave: jest.fn(),
    };

    const joinPromise = (
      handler as unknown as {
        onJoinForum: (socket: typeof mockSocket, forumId: string) => Promise<void>;
      }
    ).onJoinForum(mockSocket, "forum-1");

    await Promise.resolve();

    expect(events).toEqual(["join:forum-1", `emit:${SOCKET_EVENTS.FORUM_JOINED}`]);

    resolveDb();
    await joinPromise;
  });
});
