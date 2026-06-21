import { useEffect, useMemo, useRef, useState } from "react";
import { PRESET_AVATARS } from "@tech4um/shared";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { getUserInitial, resolveAvatarUrl } from "../utils/resolveAvatarUrl";

type AvatarMode = "upload" | "preset";

interface ProfileAvatarEditorProps {
  username: string;
  avatarUrl?: string;
}

export function ProfileAvatarEditor({ username, avatarUrl }: ProfileAvatarEditorProps) {
  const { refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<AvatarMode>("preset");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentAvatarSrc = resolveAvatarUrl(avatarUrl);

  const previewAvatarSrc = useMemo(() => {
    if (mode === "upload" && uploadPreview) return uploadPreview;
    if (mode === "preset" && selectedPresetId) {
      const preset = PRESET_AVATARS.find((item) => item.id === selectedPresetId);
      return preset ? resolveAvatarUrl(preset.path) : currentAvatarSrc;
    }
    return currentAvatarSrc;
  }, [mode, uploadPreview, selectedPresetId, currentAvatarSrc]);

  useEffect(() => {
    return () => {
      if (uploadPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(uploadPreview);
      }
    };
  }, [uploadPreview]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 10MB.");
      return;
    }

    if (uploadPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(uploadPreview);
    }

    setSelectedFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setSelectedPresetId(null);
    setError(null);
    setFeedback(null);
    event.target.value = "";
  }

  async function handleSaveUpload() {
    if (!selectedFile) {
      setError("Escolha uma imagem antes de salvar.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Falha ao ler a imagem"));
        reader.readAsDataURL(selectedFile);
      });

      await api.patch("/auth/profile/avatar", { dataUrl });
      await refreshUser();
      setFeedback("Foto de perfil atualizada.");
      setSelectedFile(null);
      setUploadPreview(null);
    } catch {
      setError("Não foi possível atualizar a foto. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSavePreset() {
    if (!selectedPresetId) {
      setError("Escolha um avatar antes de salvar.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setFeedback(null);

    try {
      await api.patch("/auth/profile/avatar", { presetId: selectedPresetId });
      await refreshUser();
      setFeedback("Avatar atualizado.");
    } catch {
      setError("Não foi possível atualizar o avatar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-6 rounded-compact bg-surface/60 px-5 py-5">
        <div className="h-24 w-24 rounded-full overflow-hidden bg-bordergray shrink-0 shadow-compact ring-4 ring-white">
          {previewAvatarSrc ? (
            <img src={previewAvatarSrc} alt={username} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-poppins text-2xl text-background bg-primary-dark">
              {getUserInitial(username)}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <p className="font-poppins font-semibold text-base text-textgray m-0">{username}</p>
          <p className="font-poppins text-xs text-bordergray m-0">
            Pré-visualização do seu perfil no chat.
          </p>
        </div>
      </div>

      <div className="inline-flex self-start rounded-button border border-bordergray bg-surface/40 p-1 gap-1">
        <button
          type="button"
          onClick={() => {
            setMode("preset");
            setError(null);
            setFeedback(null);
          }}
          className={`h-9 px-4 rounded-button font-poppins text-xs border-0 transition-colors ${
            mode === "preset"
              ? "bg-primary-dark text-background shadow-compact"
              : "bg-transparent text-textgray hover:bg-white"
          }`}
        >
          Escolher avatar
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("upload");
            setError(null);
            setFeedback(null);
          }}
          className={`h-9 px-4 rounded-button font-poppins text-xs border-0 transition-colors ${
            mode === "upload"
              ? "bg-primary-dark text-background shadow-compact"
              : "bg-transparent text-textgray hover:bg-white"
          }`}
        >
          Enviar foto
        </button>
      </div>

      {mode === "preset" ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-compact border border-bordergray/50 bg-surface/40 p-4">
            <p className="font-poppins text-[11px] text-bordergray m-0 mb-3">
              Escolha um dos avatares abaixo
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {PRESET_AVATARS.map((preset) => {
              const presetSrc = resolveAvatarUrl(preset.path);
              const isSelected = selectedPresetId === preset.id;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedPresetId(preset.id);
                    setError(null);
                    setFeedback(null);
                  }}
                  className={`flex flex-col items-center gap-1 border-0 bg-transparent p-0 cursor-pointer ${
                    isSelected ? "opacity-100" : "opacity-90 hover:opacity-100"
                  }`}
                  aria-label={preset.label}
                  title={preset.label}
                >
                  <span
                    className={`h-14 w-14 rounded-full overflow-hidden block ${
                      isSelected ? "ring-2 ring-primary-dark ring-offset-2" : ""
                    }`}
                  >
                    {presetSrc && (
                      <img src={presetSrc} alt={preset.label} className="h-full w-full object-cover" />
                    )}
                  </span>
                </button>
              );
            })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSavePreset}
            disabled={isSaving || !selectedPresetId}
            className="self-start h-10 px-5 rounded-button bg-primary-dark text-background font-poppins text-sm border-0 cursor-pointer disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Salvar avatar"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 items-start rounded-compact border border-bordergray/50 bg-surface/40 p-4 w-full">
          <p className="font-poppins text-[11px] text-bordergray m-0">
            Envie uma foto JPG, PNG, GIF ou WebP de até 10MB.
          </p>

          {uploadPreview && (
            <img
              src={uploadPreview}
              alt="Pré-visualização da foto"
              className="h-28 w-28 rounded-full object-cover border border-bordergray"
            />
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 px-4 rounded-button border border-primary-dark text-primary-dark font-poppins text-sm bg-white cursor-pointer hover:bg-surface transition-colors"
          >
            Selecionar imagem
          </button>

          <button
            type="button"
            onClick={handleSaveUpload}
            disabled={isSaving || !selectedFile}
            className="h-10 px-5 rounded-button bg-primary-dark text-background font-poppins text-sm border-0 cursor-pointer disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Salvar foto"}
          </button>
        </div>
      )}

      {feedback && (
        <p className="font-poppins text-xs text-primary-dark m-0">{feedback}</p>
      )}
      {error && (
        <p className="font-poppins text-xs text-secondary-default m-0">{error}</p>
      )}
    </div>
  );
}
