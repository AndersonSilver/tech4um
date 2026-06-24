import { User } from "../entities/User";

describe("User", () => {
  it("toPublic expõe apenas campos públicos", () => {
    const user = new User();
    user.id = "user-1";
    user.username = "lara";
    user.email = "lara@email.com";
    user.avatarUrl = "/api/avatars/blue-bot.svg";
    user.passwordHash = "hash-secreto";

    expect(user.toPublic()).toEqual({
      id: "user-1",
      username: "lara",
      email: "lara@email.com",
      avatarUrl: "/api/avatars/blue-bot.svg",
      hasPassword: true,
      hasGoogle: false,
    });
    expect(user.toPublic()).not.toHaveProperty("passwordHash");
  });
});
