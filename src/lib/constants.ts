export const SITE_NAME = "GitHub User Estimation";
export const SITE_DESCRIPTION =
  "Statistical estimation of total valid GitHub users using stratified random sampling";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/realtime", label: "Realtime", live: true },
  { href: "/methodology", label: "Methodology" },
  { href: "/results", label: "Results" },
  { href: "/report", label: "Report" },
] as const;

export const FIGURE_CAPTIONS: Record<string, { title: string; description: string }> = {
  fig1_unbiasedness: {
    title: "Figure 1: Unbiasedness Proof",
    description:
      "Scatter of partition estimates at each budget level around grand mean. ~50% above/below confirms unbiasedness.",
  },
  fig2_correctness: {
    title: "Figure 2: Correctness Proof",
    description:
      "Mean estimate with 95% CI error bars across budget levels. Flat mean = correct; shrinking CI = consistent.",
  },
  fig3_relative_error: {
    title: "Figure 3: Relative Error Distribution",
    description:
      "Boxplots of estimation error at different sampling rates from validation strata. Error shrinks with more samples.",
  },
  fig4_density_stratum: {
    title: "Figure 4: Validity Rate by Stratum",
    description:
      "Bar chart showing account validity rate per ID range with bootstrap CIs.",
  },
  fig5_bootstrap_dist: {
    title: "Figure 5: Bootstrap Distribution",
    description:
      "Histogram of 1,000 bootstrap resamples showing uncertainty around the point estimate.",
  },
  fig6_multi_metric: {
    title: "Figure 6: Multi-Metric Summary",
    description:
      "Horizontal bar chart of population metrics (validity rate, user/org split, mean repos, etc.) with CIs.",
  },
  fig7_stratum_heatmap: {
    title: "Figure 7: Stratum Metrics Heatmap",
    description:
      "Normalized heatmap comparing validity, empty rate, repos, followers across strata.",
  },
  fig9_convergence: {
    title: "Figure 9: Convergence Plot",
    description:
      "Running estimate as samples accumulate, showing stabilization.",
  },
  fig10_validation_scatter: {
    title: "Figure 10: Validation Scatter",
    description:
      "Estimated vs ground truth valid counts per validation stratum. R-squared measures agreement.",
  },
};
