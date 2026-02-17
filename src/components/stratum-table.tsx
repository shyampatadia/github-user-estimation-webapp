import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBaseline, formatNumberFull } from "@/lib/data";

export function StratumTable() {
  const data = getBaseline();
  const strata = data.strata;
  const keys = Object.keys(strata) as (keyof typeof strata)[];

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50">
            <TableHead className="text-xs font-semibold">Stratum</TableHead>
            <TableHead className="text-xs font-semibold">ID Range</TableHead>
            <TableHead className="text-xs font-semibold text-right">Size (M_h)</TableHead>
            <TableHead className="text-xs font-semibold text-right">Sampled (n_h)</TableHead>
            <TableHead className="text-xs font-semibold text-right">Valid (k_h)</TableHead>
            <TableHead className="text-xs font-semibold text-right">p&#770;_h</TableHead>
            <TableHead className="text-xs font-semibold text-right">Contribution</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((key) => {
            const s = strata[key];
            return (
              <TableRow key={key} className="hover:bg-secondary/30">
                <TableCell className="font-mono text-sm font-medium text-primary">{key}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.label}</TableCell>
                <TableCell className="text-sm text-right font-mono tabular-nums">{formatNumberFull(s.size)}</TableCell>
                <TableCell className="text-sm text-right font-mono tabular-nums">{formatNumberFull(s.n)}</TableCell>
                <TableCell className="text-sm text-right font-mono tabular-nums">{formatNumberFull(s.k)}</TableCell>
                <TableCell className="text-sm text-right font-mono tabular-nums">{(s.p_hat * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-sm text-right font-mono tabular-nums font-medium">{formatNumberFull(s.contribution)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="bg-secondary/30 font-semibold hover:bg-secondary/40">
            <TableCell colSpan={2} className="text-sm">Total</TableCell>
            <TableCell className="text-sm text-right font-mono tabular-nums">{formatNumberFull(data.frontier_m)}</TableCell>
            <TableCell className="text-sm text-right font-mono tabular-nums">{formatNumberFull(data.methodology.sample_pool_calls)}</TableCell>
            <TableCell className="text-sm text-right font-mono tabular-nums">{formatNumberFull(data.population.total_valid)}</TableCell>
            <TableCell className="text-sm text-right font-mono tabular-nums">{(data.estimate.validity_rate * 100).toFixed(2)}%</TableCell>
            <TableCell className="text-sm text-right font-mono tabular-nums text-green-400">{formatNumberFull(data.estimate.point)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
