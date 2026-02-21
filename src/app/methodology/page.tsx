import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MathBlock } from "@/components/math-block";
import { SingleFigure } from "@/components/figure-gallery";
import { getBaseline, formatNumberFull } from "@/lib/data";

export const metadata = {
  title: "Methodology | GitHub User Estimation",
};

const STRATA_DEFINITIONS = [
  { id: "F1", range: "1 - 10,000,000", size: "10M", description: "Earliest GitHub accounts" },
  { id: "F2", range: "10M - 50M", size: "40M", description: "2012-2015 growth era" },
  { id: "F3", range: "50M - 100M", size: "50M", description: "2016-2018 expansion" },
  { id: "F4", range: "100M - 150M", size: "50M", description: "2019-2020 boom" },
  { id: "F5", range: "150M - 200M", size: "50M", description: "2021-2022 growth" },
  { id: "F6", range: "200M - 250M", size: "50M", description: "2023-2024 era" },
  { id: "F7", range: "250M - 261.7M", size: "11.7M", description: "Latest accounts (2025-2026)" },
];

export default function MethodologyPage() {
  const data = getBaseline();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Methodology</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Stratified random sampling with bootstrap confidence intervals
        </p>
      </div>

      {/* Overview */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Sampling Approach</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            GitHub assigns <strong className="text-foreground">sequential numeric IDs</strong> to every user and organization account.
            As of February 2026, the maximum observed ID (frontier) is <strong className="text-foreground">{formatNumberFull(data.frontier_m)}</strong>.
            Not all IDs correspond to valid accounts -- some have been deleted, suspended, or were never created.
          </p>
          <p>
            We divide the ID space <MathBlock math="[1, M]" display={false} /> into <strong className="text-foreground">7 strata</strong> and
            randomly sample IDs within each stratum, checking via the GitHub API whether each ID resolves to an existing account.
            The proportion of valid IDs in each stratum is used to estimate the total number of valid accounts.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Badge variant="secondary" className="font-mono">{formatNumberFull(data.methodology.total_api_calls)} API calls</Badge>
            <Badge variant="secondary" className="font-mono">{formatNumberFull(data.methodology.sample_pool_calls)} random samples</Badge>
            <Badge variant="secondary" className="font-mono">{formatNumberFull(data.methodology.ground_truth_calls)} ground truth</Badge>
            <Badge variant="secondary" className="font-mono">{data.methodology.bootstrap_iterations} bootstrap iterations</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Formulas */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Mathematical Framework</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Stratified Estimator</h3>
            <p className="text-sm text-muted-foreground mb-3">
              The total number of valid users is estimated as the sum of each stratum&apos;s contribution:
            </p>
            <div className="rounded-md bg-secondary/50 p-4 overflow-x-auto">
              <MathBlock math="\hat{N} = \sum_{h=1}^{H} M_h \cdot \hat{p}_h" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              where <MathBlock math="M_h" display={false} /> is stratum size and <MathBlock math="\hat{p}_h = k_h / n_h" display={false} /> is the sample validity rate.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Variance</h3>
            <div className="rounded-md bg-secondary/50 p-4 overflow-x-auto">
              <MathBlock math="\text{Var}(\hat{N}) = \sum_{h=1}^{H} M_h^2 \cdot \frac{\hat{p}_h (1 - \hat{p}_h)}{n_h}" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Proportional Allocation</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Sample sizes are allocated proportional to stratum sizes:
            </p>
            <div className="rounded-md bg-secondary/50 p-4 overflow-x-auto">
              <MathBlock math="n_h = \left\lfloor n \cdot \frac{M_h}{M} \right\rfloor" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Bootstrap 95% Confidence Interval</h3>
            <p className="text-sm text-muted-foreground mb-3">
              For each of B=1,000 iterations, resample within each stratum with replacement and recompute the estimator.
              The CI is the [2.5th, 97.5th] percentile of the bootstrap distribution.
            </p>
            <div className="rounded-md bg-secondary/50 p-4 overflow-x-auto">
              <MathBlock math="CI_{95\%} = \left[\hat{N}^{*(0.025)}, \hat{N}^{*(0.975)}\right]" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Unbiasedness Proof</h3>
            <p className="text-sm text-muted-foreground mb-3">
              The sample proportion is an unbiased estimator of the population proportion:
            </p>
            <div className="rounded-md bg-secondary/50 p-4 overflow-x-auto">
              <MathBlock math="E[\hat{p}_h] = p_h \implies E[\hat{N}] = \sum_h M_h \cdot p_h = N" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strata Definition Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Strata Definitions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                  <TableHead className="text-xs font-semibold">Stratum</TableHead>
                  <TableHead className="text-xs font-semibold">ID Range</TableHead>
                  <TableHead className="text-xs font-semibold">Size</TableHead>
                  <TableHead className="text-xs font-semibold">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STRATA_DEFINITIONS.map((s) => (
                  <TableRow key={s.id} className="hover:bg-secondary/30">
                    <TableCell className="font-mono text-sm font-medium text-primary">{s.id}</TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{s.range}</TableCell>
                    <TableCell className="text-sm font-mono">{s.size}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Figures: Unbiasedness + Correctness */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Estimator Properties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SingleFigure figKey="fig1_unbiasedness" src="/figures/fig1_unbiasedness.png" />
          <SingleFigure figKey="fig2_correctness" src="/figures/fig2_correctness.png" />
        </div>
      </div>
    </div>
  );
}
