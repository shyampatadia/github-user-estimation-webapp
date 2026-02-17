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
              <CardTitle className="text-base">Partition Analysis (Unbiasedness Check)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                      <TableHead className="text-xs font-semibold">Budget</TableHead>
                      <TableHead className="text-xs font-semibold text-right"># Partitions</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Mean Estimate</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Std Dev</TableHead>
                      <TableHead className="text-xs font-semibold text-right">SE of Mean</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(data.partitions).map(([budget, p]) => (
                      <TableRow key={budget} className="hover:bg-secondary/30">
                        <TableCell className="font-mono text-sm font-medium text-primary">{formatNumberFull(Number(budget))}</TableCell>
                        <TableCell className="text-sm text-right font-mono tabular-nums">{p.n_partitions}</TableCell>
                        <TableCell className="text-sm text-right font-mono tabular-nums">{formatNumberFull(p.mean)}</TableCell>
                        <TableCell className="text-sm text-right font-mono tabular-nums">{formatNumberFull(p.std)}</TableCell>
                        <TableCell className="text-sm text-right font-mono tabular-nums">{formatNumberFull(p.se_mean)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                The mean estimate is stable across budget levels (max deviation 0.20%), confirming the estimator is unbiased and correct.
              </p>
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
                  <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>
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
