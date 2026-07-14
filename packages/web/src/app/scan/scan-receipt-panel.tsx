import { buildScanReceipt, SAMPLE_SCAN_FINDINGS, type ScanConfidence } from "./scan-receipt";

const RECEIPT = buildScanReceipt(SAMPLE_SCAN_FINDINGS);

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function confidenceLabel(confidence: ScanConfidence) {
  if (confidence === "provider") return "provider reported";
  if (confidence === "observed") return "directly observed";
  return "endpoint detected";
}

export function ScanReceiptPanel() {
  return (
    <section className="vscan-panel vscan-receipt" aria-labelledby="scan-receipt-title">
      <header className="vscan-receipt-head">
        <div>
          <p className="vscan-receipt-kicker">bundled demo receipt</p>
          <h2 className="vscan-receipt-title" id="scan-receipt-title">
            See exactly what became a usage record.
          </h2>
        </div>
        <span className="vscan-receipt-boundary">zero network / no upload</span>
      </header>

      <p className="vscan-receipt-disclosure">
        This is an example of the receipt the CLI produces. It is not a scan of this browser or
        machine.
      </p>
      <p className="vscan-receipt-legend">
        <strong>Observed</strong> means parsed from an event log. <strong>Provider reported</strong>{" "}
        means matched to a ledger. <strong>Detected</strong> confirms a local endpoint, not spend.
      </p>

      <dl className="vscan-receipt-metrics">
        <div>
          <dt>accepted records</dt>
          <dd>{RECEIPT.records.toLocaleString("en-US")}</dd>
        </div>
        <div>
          <dt>estimated spend</dt>
          <dd>{formatUsd(RECEIPT.estimatedUsd)}</dd>
        </div>
        <div>
          <dt>direct evidence</dt>
          <dd>{RECEIPT.directEvidence}/{RECEIPT.sourceCount} sources</dd>
        </div>
        <div>
          <dt>zero-cost local</dt>
          <dd>{RECEIPT.localSources}/{RECEIPT.sourceCount} sources</dd>
        </div>
      </dl>

      <div className="vscan-receipt-table-wrap">
        <table className="vscan-receipt-table">
          <caption>Source-level normalization receipt for the bundled sample dataset</caption>
          <thead>
            <tr>
              <th>source</th>
              <th>collection method</th>
              <th>records</th>
              <th>confidence</th>
              <th>spend</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_SCAN_FINDINGS.map((finding) => (
              <tr key={finding.provider}>
                <th scope="row">{finding.provider}</th>
                <td data-label="method">{finding.method}</td>
                <td data-label="records">{finding.records.toLocaleString("en-US")}</td>
                <td data-label="confidence">
                  <span data-confidence={finding.confidence}>
                    {confidenceLabel(finding.confidence)}
                  </span>
                </td>
                <td data-label="spend">{formatUsd(finding.estimatedUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="vscan-receipt-readout">
        <strong>{RECEIPT.topProvider}</strong> carries {Math.round(RECEIPT.topShare * 100)}% of sample
        spend. Inspect its jobs first before changing providers.
      </p>
    </section>
  );
}
