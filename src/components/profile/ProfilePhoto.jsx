"use client";

import { useRef, useState } from "react";
import { Camera, ImageDown, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ImageCropDialog } from "@/components/crop/ImageCropDialog";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { Button } from "@/components/ui/button";
import { useFileDrop } from "@/hooks/useFileDrop";

/** Must match the API limits. */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Profile photo with upload, change and remove. A chosen file is checked (type and size), then
 * cropped in ImageCropDialog (1:1 with a circle guide by default, any shape allowed), and only the
 * cropped image is uploaded; the server
 * verifies the actual image again.
 *
 * @param {object} props
 * @param {{ name: string, avatar?: { url: string } | null }} props.user - The signed-in user.
 * @param {(file: File) => Promise<object>} props.onUpload - Uploads a new photo.
 * @param {() => Promise<object>} props.onRemove - Removes the photo.
 * @returns {JSX.Element}
 */
export function ProfilePhoto({ user, onUpload, onRemove }) {
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // A chosen photo waiting to be cropped (the crop dialog is open while this is set).
  const [pendingFile, setPendingFile] = useState(null);
  const fileRef = useRef(null);
  const hasPhoto = Boolean(user.avatar?.url);

  /** Runs an upload or removal with a toast. */
  async function run(action, success) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  /** Checks a chosen or dropped file and opens the cropper. */
  function chooseFile(file) {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type) || file.size > MAX_PHOTO_BYTES) {
      toast.error("Choose a JPEG, PNG, WebP or GIF image up to 5 MB.");
      return;
    }
    setPendingFile(file);
  }

  /** File picked with the button or the camera icon. */
  function handleFile(event) {
    chooseFile(event.target.files?.[0]);
    event.target.value = "";
  }

  const { isDragging, dropProps } = useFileDrop((files) => chooseFile(files[0]), { disabled: busy });

  /** Uploads the cropped square. */
  function handleCropped(cropped) {
    setPendingFile(null);
    run(() => onUpload(cropped), "Profile photo updated.");
  }

  return (
    <div className="relative -m-3 flex items-center gap-5 rounded-2xl p-3" {...dropProps}>
      {isDragging && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-strong bg-brand-soft/95 text-[15px] font-bold text-brand-strong"
          aria-hidden="true"
        >
          <ImageDown className="size-5" />
          Drop a photo to crop and use it
        </div>
      )}
      <div className="relative">
        <UserAvatar name={user.name} avatar={user.avatar} size="lg" ringed />
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/40" role="status">
            <LoaderCircle className="size-6 animate-spin text-white" aria-label="Saving photo" />
          </span>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          aria-label={hasPhoto ? "Change profile photo" : "Upload profile photo"}
          title={hasPhoto ? "Change photo" : "Upload photo"}
          className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border-2 border-card bg-primary text-foreground hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
        >
          <Camera className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="h-9 rounded-[10px] px-3.5 text-sm font-bold"
          >
            {hasPhoto ? "Change photo" : "Upload photo"}
          </Button>
          {hasPhoto && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmOpen(true)}
              disabled={busy}
              className="h-9 rounded-[10px] px-3.5 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or GIF, up to 5 MB. Drop a photo here or choose one; you can crop it before saving.</p>
      </div>

      <input ref={fileRef} type="file" accept={PHOTO_TYPES.join(",")} hidden onChange={handleFile} aria-label="Profile photo file" />
      <ImageCropDialog
        file={pendingFile}
        title="Crop profile photo"
        defaultAspect="1:1"
        circleGuide
        maxSize={1024}
        onCancel={() => setPendingFile(null)}
        onApply={handleCropped}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remove your profile photo?"
        description="Your initials will be shown instead. You can upload a new photo at any time."
        confirmLabel="Remove"
        onConfirm={() => run(onRemove, "Profile photo removed.")}
      />
    </div>
  );
}
