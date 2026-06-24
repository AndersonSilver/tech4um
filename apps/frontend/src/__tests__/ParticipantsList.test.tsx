import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ParticipantsList } from "../components/ParticipantsList";
import { ForumParticipant } from "../types";

const participants: ForumParticipant[] = [
  {
    id: "p1",
    userId: "u1",
    isOnline: false,
    user: {
      id: "u1",
      username: "Lara",
      email: "lara@email.com",
      
    },
  },
  {
    id: "p2",
    userId: "u2",
    isOnline: true,
    user: {
      id: "u2",
      username: "Lucas",
      email: "lucas@email.com",
      
    },
  },
];

describe("ParticipantsList", () => {
  it("lista os participantes da sala", () => {
    render(
      <ParticipantsList
        participants={participants}
        currentUserId="u1"
        onSelectParticipant={vi.fn()}
      />
    );

    expect(screen.getByText("Participantes")).toBeInTheDocument();
    expect(screen.getByText("Lara")).toBeInTheDocument();
    expect(screen.getByText("Lucas")).toBeInTheDocument();
  });

  it("chama onSelectParticipant ao clicar em um participante", () => {
    const onSelectParticipant = vi.fn();
    render(
      <ParticipantsList
        participants={participants}
        currentUserId="u1"
        onSelectParticipant={onSelectParticipant}
      />
    );

    fireEvent.click(screen.getByText("Lucas"));

    expect(onSelectParticipant).toHaveBeenCalledWith(participants[1]);
  });

  it("mostra indicador online apenas quando isOnline é true", () => {
    render(
      <ParticipantsList
        participants={participants}
        currentUserId="u1"
        onSelectParticipant={vi.fn()}
      />
    );

    const laraRow = screen.getByText("Lara").closest("button");
    expect(laraRow?.querySelector(".bg-green-500")).toBeFalsy();

    const lucasRow = screen.getByText("Lucas").closest("button");
    expect(lucasRow?.querySelector(".bg-green-500")).toBeTruthy();
  });

  it("destaca participante ativo para mensagem privada", () => {
    render(
      <ParticipantsList
        participants={participants}
        currentUserId="u1"
        activePrivateTo="u2"
        onSelectParticipant={vi.fn()}
      />
    );

    const lucasRow = screen.getByText("Lucas").closest("button");
    expect(lucasRow?.className).toContain("bg-primary-dark/5");
  });
});
