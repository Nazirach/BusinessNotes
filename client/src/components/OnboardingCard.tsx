import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOnboardingProgress } from "@/lib/onboarding";
import { useLocale } from "@/lib/i18n";

type OnboardingStep = {
  id: string;
  label: string;
  description: string;
  complete: boolean;
  actionLabel: string;
};

export function OnboardingCard({ steps, profileFields, onAction, onDismiss }: { steps: OnboardingStep[]; profileFields: { label: string; complete: boolean }[]; onAction: (id: string) => void; onDismiss: () => void }) {
  const { t } = useLocale();
  const completed = profileFields.filter(field => field.complete).length;
  const progress = getOnboardingProgress(completed, profileFields.length);
  return <section aria-labelledby="onboarding-title" className="relative overflow-hidden rounded-[22px] border border-[#cfe1dc] bg-[#eff8f5] p-5 shadow-[0_12px_28px_rgba(43,121,109,0.08)] sm:p-6">
    <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full border-[18px] border-white/45" />
    <button onClick={onDismiss} aria-label={t("Dismiss onboarding")} className="absolute right-4 top-4 rounded-full p-1.5 text-[#6e9690] hover:bg-white/70"><X size={16} /></button>
    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-md"><div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#2b796d]"><Sparkles size={14} /> {t("Welcome to BusinessNotes")}</div><h2 id="onboarding-title" className="text-xl font-extrabold tracking-[-0.035em] text-[#173b59]">{t("Make your first business move")}</h2><p className="mt-2 text-xs leading-5 text-[#5f7c80]">{t("Complete a few quick steps so your feed, connections, and opportunity radar become more relevant.")}</p></div>
      <div className="relative min-w-[180px] rounded-[15px] bg-white/75 p-3 lg:w-[220px]"><div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#6d8b8b]"><span>{t("Profile progress")}</span><span className="text-[#277568]">{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#dcece6]"><div className="h-full rounded-full bg-[#2b9a8b] transition-all duration-300" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-[10px] font-medium text-[#789392]">{completed} of {profileFields.length} {t("profile fields complete")}</p></div>
    </div><div className="relative mt-4 flex flex-wrap gap-2">{profileFields.map(field => <span key={field.label} className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${field.complete ? "bg-[#dff1e9] text-[#277568]" : "bg-white/65 text-[#789092]"}`}>{field.complete ? "✓ " : "○ "}{field.label}</span>)}</div>
    <div className="relative mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{steps.map(step => <div key={step.id} className={`rounded-[15px] border p-3 ${step.complete ? "border-[#b9dace] bg-white/70" : "border-white/80 bg-white/45"}`}><div className="flex items-start gap-2"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${step.complete ? "bg-[#2b9a8b] text-white" : "border border-[#a9c9c2] text-transparent"}`}><Check size={12} /></span><div className="min-w-0"><p className="text-xs font-extrabold text-[#315d68]">{step.label}</p><p className="mt-1 text-[10px] leading-4 text-[#789092]">{step.description}</p>{!step.complete && <Button variant="ghost" onClick={() => onAction(step.id)} className="mt-2 h-auto p-0 text-[10px] font-extrabold text-[#277568] hover:bg-transparent hover:text-[#1f665d]">{step.actionLabel}<ArrowRight size={12} className="ml-1" /></Button>}</div></div></div>)}</div>
  </section>;
}
