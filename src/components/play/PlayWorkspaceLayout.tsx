import type { ReactNode } from "react"
import { Group, Panel, useDefaultLayout } from "react-resizable-panels"
import { useMediaQuery } from "../../hooks/useMediaQuery"
import SplitHandle from "./SplitHandle"

const LAYOUT_STORAGE_KEY = "hackit.playArena.layout.v1"

type PlayWorkspaceLayoutProps = {
  problemPanel: ReactNode
  solutionPanel: ReactNode
  testPanel: ReactNode
  onLayoutChange?: () => void
}

const PlayWorkspaceLayout = ({
  problemPanel,
  solutionPanel,
  testPanel,
  onLayoutChange,
}: PlayWorkspaceLayoutProps) => {
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  const mainLayout = useDefaultLayout({
    id: `${LAYOUT_STORAGE_KEY}.main`,
    panelIds: ["problem", "workspace"],
    storage: localStorage,
  })

  const workspaceLayout = useDefaultLayout({
    id: `${LAYOUT_STORAGE_KEY}.workspace`,
    panelIds: ["solution", "tests"],
    storage: localStorage,
  })

  const handleLayoutChanged = () => {
    onLayoutChange?.()
  }

  if (!isDesktop) {
    return (
      <div className="absolute inset-0 flex flex-col min-h-0 overflow-hidden">
        <aside className="shrink-0 max-h-[45vh] overflow-y-auto border-b border-border bg-surface/50">
          {problemPanel}
        </aside>
        <section className="flex flex-col flex-1 min-h-0 bg-primary">
          <div className="flex flex-col flex-1 min-h-0 border-b border-border">
            {solutionPanel}
          </div>
          <div className="flex flex-col min-h-[180px] max-h-[40vh] shrink-0">
            {testPanel}
          </div>
        </section>
      </div>
    )
  }

  return (
    <Group
      id="play-main"
      orientation="horizontal"
      className="absolute inset-0 min-h-0"
      defaultLayout={mainLayout.defaultLayout}
      onLayoutChange={mainLayout.onLayoutChange}
      onLayoutChanged={(layout, meta) => {
        mainLayout.onLayoutChanged(layout, meta)
        handleLayoutChanged()
      }}
    >
      <Panel id="problem" defaultSize="42" minSize="22" maxSize="65" className="min-h-0">
        <aside className="h-full overflow-y-auto border-r border-border bg-surface/50">
          {problemPanel}
        </aside>
      </Panel>

      <SplitHandle direction="vertical" />

      <Panel id="workspace" defaultSize="58" minSize="35" className="min-h-0">
        <Group
          id="play-workspace"
          orientation="vertical"
          className="h-full min-h-0"
          defaultLayout={workspaceLayout.defaultLayout}
          onLayoutChange={workspaceLayout.onLayoutChange}
          onLayoutChanged={(layout, meta) => {
            workspaceLayout.onLayoutChanged(layout, meta)
            handleLayoutChanged()
          }}
        >
          <Panel id="solution" defaultSize="68" minSize="35" className="min-h-0">
            <section className="flex h-full min-h-0 flex-col bg-primary">{solutionPanel}</section>
          </Panel>

          <SplitHandle direction="horizontal" />

          <Panel id="tests" defaultSize="32" minSize="20" className="min-h-0">
            <section className="flex h-full min-h-0 flex-col border-t border-border bg-surface-raised/80">
              {testPanel}
            </section>
          </Panel>
        </Group>
      </Panel>
    </Group>
  )
}

export default PlayWorkspaceLayout
