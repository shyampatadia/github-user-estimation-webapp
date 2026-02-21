import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StratumTable } from "@/components/stratum-table";
import { SingleFigure, FigureGallery } from "@/components/figure-gallery";
import {
  AccountTypePie,
  CreationYearChart,
  DormancyChart,
  ReposDistribution,
} from "@/components/population-charts";
import { getBaseline, formatNumberFull } from "@/lib/data";

export const metadata = {
  title: "Results | GitHub User Estimation",
};

export default function ResultsPage() {
  const data = getBaseline();
  const gt = data.ground_truth;
  const gtKeys = Object.keys(gt) as (keyof typeof gt)[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Results</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete estimation results, validation, and population characteristics
        </p>
      </div>

      {/* Baseline study notice */}
      <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3">
        <svg className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-amber-400">Baseline Study Results — Not Realtime</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            All figures, CI bounds, and statistics on this page are from our one-time baseline study conducted on{" "}
            <span className="font-medium text-foreground">{data.generated_at}</span> using 16,000 sampled IDs across 7 strata.
            The 95% CI reflects sampling uncertainty from that study.
            For the live estimate with a dynamically updated CI, see the{" "}
            <a href="/realtime" className="text-primary hover:underline font-medium">Realtime Monitor</a>.
          </p>
        </div>
      </div>

      <Tabs defaultValue="estimation" className="w-full">
        <TabsList className="bg-secondary/50 border border-border">
          <TabsTrigger value="estimation">Estimation</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="population">Population</TabsTrigger>
          <TabsTrigger value="figures">All Figures</TabsTrigger>
        </TabsList>

        {/* === Estimation Tab === */}
        <TabsContent value="estimation" className="space-y-6 mt-6">
          {/* Point Estimate Summary */}
          <Card className="bg-card border-border gradient-border">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Point Estimate</p>
                  <p className="text-2xl font-bold text-green-400 font-mono tabular-nums">{formatNumberFull(data.estimate.point)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">95% CI Lower</p>
                  <p className="text-2xl font-bold text-foreground font-mono tabular-nums">{formatNumberFull(data.estimate.ci_lower)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">95% CI Upper</p>
                  <p className="text-2xl font-bold text-foreground font-mono tabular-nums">{formatNumberFull(data.estimate.ci_upper)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Relative CI Width</p>
                  <p className="text-2xl font-bold text-blue-400 font-mono tabular-nums">{(data.estimate.relative_ci_width * 100).toFixed(2)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Per-Stratum Results</h2>
            <StratumTable />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SingleFigure figKey="fig5_bootstrap_dist" src="/figures/fig5_bootstrap_dist.png" />
            <SingleFigure figKey="fig4_density_stratum" src="/figures/fig4_density_stratum.png" />
          </div>

          {/* Partition Analysis */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Unbiasedness Check — Does the answer change with fewer samples?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Plain-English walkthrough */}
              <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">What this test is asking</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A good estimator should give roughly the <span className="text-foreground font-medium">same answer</span> regardless
                  of how many samples you use — it just gets noisier with fewer samples.
                  To verify this, we split our 16,000-sample budget into smaller groups (partitions) at different sizes
                  and ran the estimator independently on each group.
                  If the <span className="text-foreground font-medium">average estimate</span> stays near ~214M at every budget level,
                  the estimator is <span className="text-green-400 font-medium">unbiased</span>.
                </p>
              </div>

              {/* Column legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { label: "Samples per run", desc: "How many API probes each independent run used" },
                  { label: "Independent runs", desc: "How many non-overlapping groups we could form" },
                  { label: "Average estimate", desc: "Mean of all runs — should stay near 214M" },
                  { label: "Run-to-run spread", desc: "Std dev across runs — should shrink as samples grow" },
                ].map((c) => (
                  <div key={c.label} className="rounded-md bg-secondary/40 p-2.5 space-y-1">
                    <p className="font-semibold text-foreground">{c.label}</p>
                    <p className="text-muted-foreground leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>

              {/* Table */}
              {(() => {
                const finalMean = data.partitions["16000"].mean;
                return (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                          <TableHead className="text-xs font-semibold">Samples per run</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Independent runs</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Average estimate</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Run-to-run spread</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Drift from final</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(data.partitions).map(([budget, p]) => {
                          const drift = Math.abs(p.mean - finalMean) / finalMean * 100;
                          const isFinal = budget === "16000";
                          return (
                            <TableRow key={budget} className={isFinal ? "bg-green-500/5 hover:bg-green-500/10" : "hover:bg-secondary/30"}>
                              <TableCell className={`font-mono text-sm font-medium ${isFinal ? "text-green-400" : "text-primary"}`}>
                                {formatNumberFull(Number(budget))}
                                {isFinal && <span className="ml-2 text-xs text-green-400/70">(final study)</span>}
                              </TableCell>
                              <TableCell className="text-sm text-right font-mono tabular-nums text-muted-foreground">{p.n_partitions}</TableCell>
                              <TableCell className="text-sm text-right font-mono tabular-nums text-foreground font-medium">{formatNumberFull(p.mean)}</TableCell>
                              <TableCell className="text-sm text-right font-mono tabular-nums text-muted-foreground">
                                {p.std > 0 ? `±${formatNumberFull(p.std)}` : <span className="text-green-400">—</span>}
                              </TableCell>
                              <TableCell className="text-sm text-right font-mono tabular-nums">
                                {isFinal ? (
                                  <span className="text-green-400 font-medium">baseline</span>
                                ) : (
                                  <span className={drift < 0.3 ? "text-green-400" : drift < 1.0 ? "text-amber-400" : "text-red-400"}>
                                    {drift.toFixed(2)}%
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}

              {/* Takeaway */}
              <div className="flex items-start gap-3 rounded-md border border-green-500/20 bg-green-500/5 p-3">
                <svg className="h-4 w-4 text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <p className="text-sm text-muted-foreground">
                  <span className="text-green-400 font-semibold">Result: unbiased. </span>
                  Even with as few as 1,000 samples per run, the average estimate stays within <span className="text-foreground font-medium">0.20%</span> of
                  the full-budget answer. The spread (std dev) decreases as expected when more samples are used,
                  confirming the estimator is both unbiased and statistically consistent.
                </p>
              </div>
            </CardContent>
          </Card>

          <SingleFigure figKey="fig9_convergence" src="/figures/fig9_convergence.png" />
        </TabsContent>

        {/* === Validation Tab === */}
        <TabsContent value="validation" className="space-y-6 mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Ground Truth Validation Strata</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                8 contiguous ID blocks were exhaustively enumerated (every ID checked) to provide ground truth for validation.
              </p>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                      <TableHead className="text-xs font-semibold">Stratum</TableHead>
                      <TableHead className="text-xs font-semibold">Description</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Valid</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Invalid</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Validity Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gtKeys.map((key) => {
                      const v = gt[key];
                      return (
                        <TableRow key={key} className="hover:bg-secondary/30">
                          <TableCell className="font-mono text-sm font-medium text-primary">{key}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{v.description}</TableCell>
                          <TableCell className="text-sm text-right font-mono tabular-nums">{formatNumberFull(v.total)}</TableCell>
                          <TableCell className="text-sm text-right font-mono tabular-nums text-green-400">{formatNumberFull(v.valid)}</TableCell>
                          <TableCell className="text-sm text-right font-mono tabular-nums text-red-400">{formatNumberFull(v.invalid)}</TableCell>
                          <TableCell className="text-sm text-right font-mono tabular-nums font-medium">{(v.rate * 100).toFixed(1)}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SingleFigure figKey="fig10_validation_scatter" src="/figures/fig10_validation_scatter.png" />
            <SingleFigure figKey="fig3_relative_error" src="/figures/fig3_relative_error.png" />
          </div>

          {/* Error by Sampling Rate */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Estimation Error by Sampling Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                      <TableHead className="text-xs font-semibold">Sampling Rate</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Runs</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Mean Error</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Std Dev</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Max |Error|</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(data.validation.error_by_rate).map(([rate, v]) => (
                      <TableRow key={rate} className="hover:bg-secondary/30">
                        <TableCell className="font-mono text-sm font-medium text-primary">{(Number(rate) * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-sm text-right font-mono tabular-nums">{v.runs}</TableCell>
                        <TableCell className="text-sm text-right font-mono tabular-nums">{v.mean_error.toFixed(4)}</TableCell>
                        <TableCell className="text-sm text-right font-mono tabular-nums">{v.std.toFixed(4)}</TableCell>
                        <TableCell className="text-sm text-right font-mono tabular-nums">{v.max_abs.toFixed(4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Mean error is near zero at all rates (unbiased). Standard deviation decreases as 1/sqrt(n), confirming consistency.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === Population Tab === */}
        <TabsContent value="population" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AccountTypePie />
            <ReposDistribution />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CreationYearChart />
            <DormancyChart />
          </div>

          {/* Stratum Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Stratum-Level Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                      <TableHead className="text-xs font-semibold">Stratum</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Validity %</TableHead>
                      <TableHead className="text-xs font-semibold text-right">User %</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Org %</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Mean Repos</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Empty %</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Mean Followers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(data.stratum_details).map(([key, d]) => (
                      <TableRow key={key} className="hover:bg-secondary/30">
                        <TableCell className="font-mono text-sm font-medium text-primary">{key}</TableCell>
                        <TableCell className="text-sm text-right font-mono tabular-nums">{d.validity.toFixed(1)}%</TableCell>
                        <TableCell className="text-sm text-right font-mono tabular-nums">{d.user_pct.toFixed(1)}%</TableCell>
                        <TableCell className="text-sm text-right font-mono tabular-nums">{d.org_pct.toFixed(1)}%</TableCell>
                        <TableCell className="text-sm text-right font-mono tabular-nums">{d.mean_repos.toFixed(1)}</TableCell>
                        <TableCell className="text-sm text-right font-mono tabular-nums">{d.empty_pct.toFixed(1)}%</TableCell>
                        <TableCell className="text-sm text-right font-mono tabular-nums">{d.mean_followers.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SingleFigure figKey="fig7_stratum_heatmap" src="/figures/fig7_stratum_heatmap.png" />
            <SingleFigure figKey="fig6_multi_metric" src="/figures/fig6_multi_metric.png" />
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Mean Followers", value: data.population.followers.mean.toString(), sub: `${data.population.followers.zero_pct}% have 0` },
              { label: "Mean Following", value: data.population.following.mean.toString(), sub: `${data.population.following.zero_pct}% have 0` },
              { label: "Mean Gists", value: data.population.gists.mean.toString(), sub: `${data.population.gists.zero_pct}% have 0` },
              { label: "Max Repos", value: formatNumberFull(data.population.repos.max), sub: `Std dev: ${data.population.repos.std}` },
            ].map((s) => (
              <Card key={s.label} className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-xl font-bold text-foreground font-mono">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* === All Figures Tab === */}
        <TabsContent value="figures" className="mt-6">
          <FigureGallery />
        </TabsContent>
      </Tabs>
    </div>
  );
}
