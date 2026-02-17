import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Report | GitHub User Estimation",
};

export default function ReportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Research Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete statistical analysis of GitHub user population estimation
          </p>
        </div>
        <a href="/report.pdf" download>
          <Button variant="outline" className="gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download PDF
          </Button>
        </a>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-0">
          <iframe
            src="/report.pdf"
            className="w-full border-0"
            style={{ height: "85vh" }}
            title="GitHub User Estimation Report"
          />
        </CardContent>
      </Card>
    </div>
  );
}
