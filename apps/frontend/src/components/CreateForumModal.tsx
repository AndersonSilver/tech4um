import { useState, FormEvent } from "react";

interface CreateForumModalProps {
  onClose: () => void;
  onCreate: (name: string, description?: string) => Promise<void>;
}

export function CreateForumModal({ onClose, onCreate }: CreateForumModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onCreate(name, description || undefined);
      onClose();
    } catch {
      setError("Não foi possível criar o fórum. O nome pode já estar em uso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white flex flex-col gap-6 items-start p-10 rounded-2xl w-[420px]"
      >
        <p className="font-poppins font-bold text-primary-default text-[22px] m-0">
          Crie seu próprio 4um
        </p>

        <label className="flex flex-col items-start w-full border border-background rounded px-3">
          <span className="font-roboto text-xs text-textgray tracking-[0.15px] bg-white px-1">
            Nome do fórum
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full py-[7px] font-roboto text-base text-primary-dark outline-none bg-transparent"
          />
        </label>

        <label className="flex flex-col items-start w-full border border-background rounded px-3">
          <span className="font-roboto text-xs text-textgray tracking-[0.15px] bg-white px-1">
            Descrição (opcional)
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full py-[7px] font-roboto text-base text-primary-dark outline-none bg-transparent resize-none"
          />
        </label>

        {error && <p className="text-secondary-default text-sm font-poppins">{error}</p>}

        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-button border border-textgray font-poppins text-textgray"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 h-11 bg-primary-dark rounded-button font-poppins font-semibold text-background disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar"}
          </button>
        </div>
      </form>
    </div>
  );
}
