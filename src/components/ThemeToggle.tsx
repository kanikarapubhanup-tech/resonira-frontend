import { useTheme } from "@/components/theme-provider"
import { Switch } from "@/components/ui/switch"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center justify-between px-5 pb-5">
      <span className="text-[13px] font-medium text-muted-foreground tracking-wide">
        Theme
      </span>
      <Switch 
        checked={theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        className="scale-90"
      />
    </div>
  )
}
