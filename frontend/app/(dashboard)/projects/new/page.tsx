import { ProjectForm } from "@/components/projects/project-form";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">New Project</h2>
      <ProjectForm />
    </div>
  );
}
