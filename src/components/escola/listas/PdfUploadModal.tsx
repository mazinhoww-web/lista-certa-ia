// "Já tenho a lista em PDF" fallback. Uploads the file to the school-lists
// bucket under {school_id}/{list_id}/{filename}, then creates a draft list
// row with pending_manual_digitization=true via the create_list_with_items
// RPC (with empty items array). Auto-digitization (OCR / parsing) is the
// next slice; for now the operator's instructed that it'll be processed
// manually.

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateList } from "@/hooks/useCreateList";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB (bucket limit, mirrored client-side)
const ACCEPTED = "application/pdf";

interface Props {
  open: boolean;
  schoolId: string;
  defaultGrade?: string;
  defaultSchoolYear?: number;
  onClose: () => void;
  onSuccess: (listId: string) => void;
}

export function PdfUploadModal({
  open,
  schoolId,
  defaultGrade = "",
  defaultSchoolYear,
  onClose,
  onSuccess,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [grade, setGrade] = useState(defaultGrade);
  const [schoolYear, setSchoolYear] = useState(
    defaultSchoolYear ?? new Date().getFullYear() + 1,
  );
  const [submitting, setSubmitting] = useState(false);
  const createList = useCreateList();

  const reset = () => {
    setFile(null);
    setGrade(defaultGrade);
    setSchoolYear(defaultSchoolYear ?? new Date().getFullYear() + 1);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = (f: File | null) => {
    if (!f) {
      setFile(null);
      return;
    }
    if (f.type !== ACCEPTED) {
      toast.error("Aceitamos apenas PDF por enquanto.");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("Arquivo grande demais. Máximo 15 MB.");
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!file || !grade.trim()) return;
    setSubmitting(true);
    try {
      // Path: {school_id}/{timestamp}-{filename} — no list_id yet because
      // we want the path to live under the school folder before the row
      // exists. The RPC stores the public URL, the bucket stays private,
      // and the file is never read by the parent flow.
      const safeName = file.name.replace(/[^A-Za-z0-9.\-_]+/g, "_");
      const objectPath = `${schoolId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("school-lists")
        .upload(objectPath, file, {
          contentType: file.type,
          upsert: false,
        });
      if (upErr) {
        console.error("[pdf-upload] upload failed", {
          school_id: schoolId,
          message: upErr.message,
        });
        toast.error("Falha ao enviar o PDF. Tente novamente.");
        return;
      }

      const listId = await createList.mutateAsync({
        schoolId,
        grade: grade.trim(),
        schoolYear,
        teacherName: null,
        source: "school_upload_pdf",
        pendingManualDigitization: true,
        rawFileUrl: objectPath,
        items: [],
      });
      toast.success("PDF recebido. Vamos digitalizar e te avisar.");
      reset();
      onSuccess(listId);
    } catch (err) {
      console.error("[pdf-upload] failed", { message: (err as Error).message });
      toast.error("Não conseguimos registrar agora. Tente em instantes.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !!file && grade.trim().length >= 2 && !submitting;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir lista em PDF</DialogTitle>
          <DialogDescription>
            Vamos digitalizar e te avisar quando estiver pronta. Enquanto isso,
            ela aparece como "Aguardando digitalização" na sua lista.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
              Turma
            </label>
            <input
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Ex.: 3º Ano"
              className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
              Ano letivo
            </label>
            <input
              type="number"
              min={2024}
              max={2099}
              value={schoolYear}
              onChange={(e) =>
                setSchoolYear(parseInt(e.target.value, 10) || schoolYear)
              }
              className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
            />
          </div>
          <div>
            <label
              htmlFor="pdf-file-input"
              className="block text-xs font-semibold uppercase tracking-wider text-lc-mid"
            >
              Arquivo PDF (até 15 MB)
            </label>
            <input
              ref={inputRef}
              id="pdf-file-input"
              type="file"
              accept={ACCEPTED}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm"
            />
            {file && (
              <p className="mt-1 text-xs text-lc-mid">
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="h-11 px-5 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold hover:bg-lc-surface transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="w-4 h-4" aria-hidden />
            )}
            Enviar PDF
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
