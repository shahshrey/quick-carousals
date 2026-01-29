import { Card } from "@saasfly/ui/card"
import * as Icons from "@saasfly/ui/icons";

export function FeaturesGrid({ dict } : { dict: Record<string, string> | undefined }) {
  return (
    <div className="flex gap-4 flex-col sm:flex-row md:flex-row xl:flex-row">
      <Card className="p-3 w-full rounded-3xl dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Icons.Sparkles className="w-6 h-6 text-purple-500" />
            </div>
            <h2 className="text-lg font-semibold">AI-Powered Generation</h2>
          </div>
          <p className="leading-relaxed text-neutral-500 dark:text-neutral-400 font-medium">
            Turn any topic or text into a professional carousel in minutes with smart AI that understands LinkedIn.
          </p>
        </div>
      </Card>

      <Card className="p-3 w-full rounded-3xl dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Icons.Palette className="w-6 h-6 text-purple-500" />
            </div>
            <h2 className="text-lg font-semibold">8 Style Kits</h2>
          </div>
          <p className="leading-relaxed text-neutral-500 dark:text-neutral-400 font-medium">
            Curated professional styles that guarantee your carousels look polished, not templated.
          </p>
        </div>
      </Card>

      <Card className="p-3 w-full rounded-3xl dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Icons.Edit className="w-6 h-6 text-purple-500" />
            </div>
            <h2 className="text-lg font-semibold">Visual Editor</h2>
          </div>
          <p className="leading-relaxed text-neutral-500 dark:text-neutral-400 font-medium">
            Click-to-edit canvas with auto-fit text that prevents ugly overflows. No design skills needed.
          </p>
        </div>
      </Card>

      <Card className="p-3 w-full rounded-3xl dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Icons.Download className="w-6 h-6 text-purple-500" />
            </div>
            <h2 className="text-lg font-semibold">Export Ready</h2>
          </div>
          <p className="leading-relaxed text-neutral-500 dark:text-neutral-400 font-medium">
            Download as PDF or PNG, ready to post on LinkedIn with perfect formatting every time.
          </p>
        </div>
      </Card>
    </div>
  )
}
