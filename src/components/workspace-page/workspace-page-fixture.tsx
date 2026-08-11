import { FolderKanban, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  ContentSection,
  DataTableFrame,
  FillViewport,
  MasterDetail,
  MetricItem,
  MetricStrip,
  PageContent,
  PageEmptyState,
  PageHeader,
  PageToolbar,
  SplitPane,
  WorkspacePage,
} from "./index";

function FixturePanel({ dark = false }: { dark?: boolean }) {
  return (
    <div className={dark ? "dark" : ""}>
      <div className="overflow-hidden rounded-lg border border-border bg-background text-foreground">
        <WorkspacePage family="library">
          <PageHeader
            eyebrow={dark ? "Dark theme" : "Light theme"}
            title="Workspace primitives"
            description="Static development fixture without feature or application data."
            actions={<Button size="sm">Primary action</Button>}
          />
          <PageContent>
          <PageToolbar
            primary={
              <div className="relative min-w-0 flex-1 sm:max-w-sm">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input aria-label="Fixture search" className="pl-8" placeholder="Search" />
              </div>
            }
            secondary={<Button variant="outline" size="sm">Filter</Button>}
          />
          <MetricStrip columns={3}>
            <MetricItem label="Active" value="8" supporting="In production" />
            <MetricItem label="Review" value="2" supporting="Awaiting feedback" />
            <MetricItem label="Delivered" value="24" supporting="This quarter" />
          </MetricStrip>
          <ContentSection title="Content section" metadata={<Badge variant="secondary">12 items</Badge>}>
            <SplitPane
              ratio="supporting"
              primary={<div className="min-h-20 rounded-md bg-muted p-3 text-sm">Primary content</div>}
              secondary={<div className="min-h-20 rounded-md bg-muted p-3 text-sm">Supporting content</div>}
            />
          </ContentSection>
          <DataTableFrame
            header={<div className="px-4 py-3 text-sm font-semibold">Data table frame</div>}
            footer={<div className="px-4 py-2 text-xs text-muted-foreground">Footer</div>}
          >
            <div className="grid min-w-[32rem] grid-cols-3 gap-4 px-4 py-3 text-sm">
              <span>Project</span><span>Status</span><span>Owner</span>
            </div>
          </DataTableFrame>
          <MasterDetail
            master={<div className="rounded-md bg-muted p-3 text-sm">Master</div>}
            detail={<div className="rounded-md bg-muted p-3 text-sm">Detail</div>}
          />
          <MasterDetail
            master={<div className="rounded-md bg-muted p-3 text-sm">Collection</div>}
            detail={<div className="rounded-md bg-muted p-3 text-sm">Preview</div>}
            inspector={<div className="rounded-md bg-muted p-3 text-sm">Inspector</div>}
          />
          <FillViewport
            className="min-h-56 rounded-lg border border-border"
            header={<div className="border-b border-border px-4 py-2 text-sm font-semibold">Fill header</div>}
            footer={<div className="border-t border-border px-4 py-2 text-xs">Fill footer</div>}
            bodyLabel="Fixture scroll region"
          >
            <PageEmptyState
              icon={<FolderKanban aria-hidden="true" />}
              title="Empty state"
              description="Named internal scroll region and reusable empty state."
              compact
            />
          </FillViewport>
          </PageContent>
        </WorkspacePage>
      </div>
    </div>
  );
}

export function WorkspacePageFixture() {
  return (
    <main className="min-h-dvh bg-muted p-4 sm:p-6">
      <div className="grid gap-6 2xl:grid-cols-2">
        <FixturePanel />
        <FixturePanel dark />
      </div>
    </main>
  );
}
