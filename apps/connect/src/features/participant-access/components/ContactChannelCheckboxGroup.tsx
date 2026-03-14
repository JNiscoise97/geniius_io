type ContactChannel = "sms" | "email" | "whatsapp" | "messenger";

type ContactChannelOption = {
  value: ContactChannel;
  label: string;
};

type ContactChannelCheckboxGroupProps = {
  value: ContactChannel[];
  enabledChannels: ContactChannel[];
  onChange: (next: ContactChannel[]) => void;
};

const OPTIONS: ContactChannelOption[] = [
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "messenger", label: "Messenger" },
];

export function ContactChannelCheckboxGroup({
  value,
  enabledChannels,
  onChange,
}: ContactChannelCheckboxGroupProps) {
  function toggle(channel: ContactChannel) {
    if (!enabledChannels.includes(channel)) {
      return;
    }

    if (value.includes(channel)) {
      onChange(value.filter((item) => item !== channel));
      return;
    }

    onChange([...value, channel]);
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {OPTIONS.map((option) => {
        const checked = value.includes(option.value);
        const enabled = enabledChannels.includes(option.value);

        return (
          <button
            key={option.value}
            type="button"
            disabled={!enabled}
            onClick={() => toggle(option.value)}
            className={[
              "rounded-2xl border px-4 py-3 text-sm font-black transition-all",
              !enabled
                ? "border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed"
                : checked
                  ? "border-[color:var(--blue)] bg-indigo-50 text-slate-900"
                  : "border-slate-200 bg-white text-slate-700",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export type { ContactChannel };