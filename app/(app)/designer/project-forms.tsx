"use client";

import { Plus } from "lucide-react";
import { useActionState, useState } from "react";
import { Field, FormMessage, SelectField, TextareaField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PROPERTY_TYPES, ROOM_TYPES } from "@/lib/constants";
import type { FormState } from "@/lib/forms";
import { createProject, createRoom, updateProject } from "./actions";

type ProjectDefaults = {
  title?: string;
  clientName?: string | null;
  propertyType?: string | null;
  address?: string | null;
  notes?: string | null;
};

function ProjectFields({ state, defaults }: { state: FormState; defaults?: ProjectDefaults }) {
  const v = (k: string, fallback?: string | null) => (state.values?.[k] as string | undefined) ?? fallback ?? "";
  return (
    <>
      <FormMessage message={state.message} ok={state.ok} />
      <Field label="Project name" name="title" placeholder="e.g. Tan family, Tampines 4-room" defaultValue={v("title", defaults?.title)} error={state.fieldErrors?.title} autoFocus />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client (optional)" name="clientName" defaultValue={v("clientName", defaults?.clientName)} error={state.fieldErrors?.clientName} />
        <SelectField
          label="Property type"
          name="propertyType"
          placeholder="Select…"
          options={PROPERTY_TYPES}
          defaultValue={v("propertyType", defaults?.propertyType)}
          error={state.fieldErrors?.propertyType}
        />
      </div>
      <Field label="Address (optional)" name="address" defaultValue={v("address", defaults?.address)} error={state.fieldErrors?.address} />
      <TextareaField label="Brief / notes (optional)" name="notes" rows={3} defaultValue={v("notes", defaults?.notes)} error={state.fieldErrors?.notes} />
    </>
  );
}

export function NewProjectDialog({ trigger }: { trigger?: React.ReactElement }) {
  const [state, action] = useActionState<FormState, FormData>(createProject, {});
  return (
    <Dialog>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="xl">
              <Plus /> New project
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">New project</DialogTitle>
          <DialogDescription>A project groups the rooms of one home or client.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4" noValidate>
          <ProjectFields state={state} />
          <SubmitButton className="w-full" pendingLabel="Creating…">
            Create project
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditProjectDialog({ projectId, defaults }: { projectId: string; defaults: ProjectDefaults }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const res = await updateProject(projectId, prev, fd);
    if (res.ok) setOpen(false);
    return res;
  }, {});
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">Edit details</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Project details</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4" noValidate>
          <ProjectFields state={{ ...state, ok: undefined, message: state.ok ? undefined : state.message }} defaults={defaults} />
          <SubmitButton className="w-full" pendingLabel="Saving…">
            Save
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewRoomDialog({ projectId }: { projectId: string }) {
  const [state, action] = useActionState<FormState, FormData>(createRoom, {});
  const [type, setType] = useState<string>((state.values?.roomType as string) ?? "living");
  const [name, setName] = useState<string>((state.values?.name as string) ?? "Living room");
  const [touched, setTouched] = useState(false);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button size="xl">
            <Plus /> Add room
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Add a room</DialogTitle>
          <DialogDescription>You can add photos straight after.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4" noValidate>
          <input type="hidden" name="projectId" value={projectId} />
          <FormMessage message={state.message} />
          <SelectField
            label="Room type"
            name="roomType"
            options={ROOM_TYPES}
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              if (!touched) setName(ROOM_TYPES.find((r) => r.value === e.target.value)?.label ?? "");
            }}
            error={state.fieldErrors?.roomType}
          />
          <Field
            label="Name"
            name="name"
            value={name}
            onChange={(e) => {
              setTouched(true);
              setName(e.target.value);
            }}
            hint="e.g. “Master bedroom” or “Kids’ room”"
            error={state.fieldErrors?.name}
          />
          <SubmitButton className="w-full" pendingLabel="Adding…">
            Add room
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
