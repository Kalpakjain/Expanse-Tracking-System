"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

import { getReceipts, uploadReceipt } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Receipt } from "@/lib/types";

export function ReceiptsWorkspace() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [merchantHint, setMerchantHint] = useState("");
  const [amountHint, setAmountHint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("Upload a receipt to generate review-ready suggestions.");

  const loadReceipts = useCallback(async (nextMessage?: string) => {
    try {
      const nextReceipts = await getReceipts();
      setReceipts(nextReceipts);
      setMessage(nextMessage ?? "Receipt automation is connected to the backend.");
    } catch {
      setMessage("Receipts API is not connected yet.");
    }
  }, []);

  useEffect(() => {
    void loadReceipts();
  }, [loadReceipts]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setMessage("Choose a receipt file first.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Uploading receipt and preparing suggestions...");

    try {
      await uploadReceipt({
        file,
        merchant_hint: merchantHint,
        amount_hint: amountHint,
      });
      setFile(null);
      setMerchantHint("");
      setAmountHint("");
      event.currentTarget.reset();
      await loadReceipts("Receipt uploaded and suggestions are ready for review.");
    } catch {
      setMessage("Could not upload the receipt right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const latestReceipt = receipts[0];
  const reviewReadyCount = receipts.filter((receipt) => receipt.status === "review_ready").length;
  const averageConfidence = receipts.length
    ? receipts.reduce((sum, receipt) => sum + receipt.confidence_score, 0) / receipts.length
    : 0;

  return (
    <main className="page-shell">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Automation</span>
          <h1>Receipt capture and smart review.</h1>
          <p>
            Upload receipts, extract starter details, and prepare transactions for human review
            before they affect your ledger.
          </p>
          <div className="hero-actions">
            <span className="button button-primary">Receipt OCR phase</span>
            <span className="button button-secondary">{message}</span>
          </div>
        </div>

        <div className="hero-balance-card">
          <div className="stat-label">Receipts processed</div>
          <div className="hero-balance-value">{receipts.length}</div>
          <div className="stat-footnote">{reviewReadyCount} ready for review</div>
        </div>
      </section>

      <section className="grid stats-grid">
        <article className="panel stat-card">
          <div className="stat-label">Latest merchant</div>
          <div className="stat-value compact-stat">{latestReceipt?.merchant_name ?? "None"}</div>
          <div className="stat-footnote">Most recent receipt upload</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Suggested amount</div>
          <div className="stat-value">
            {latestReceipt?.suggested_amount
              ? formatCurrency(latestReceipt.suggested_amount, "INR")
              : "Review"}
          </div>
          <div className="stat-footnote">Optional amount hint from upload</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Top suggestion</div>
          <div className="stat-value compact-stat">
            {latestReceipt?.suggested_category_name ?? "Pending"}
          </div>
          <div className="stat-footnote">Category candidate</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Avg confidence</div>
          <div className="stat-value">{Math.round(averageConfidence * 100)}%</div>
          <div className="stat-footnote">Current automation confidence</div>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <h2 className="section-title">Upload receipt</h2>
          <p className="section-copy">
            Attach an image or PDF receipt and add optional hints to improve the first suggestion.
          </p>

          <form className="expense-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="field-label">Receipt file</span>
              <input
                className="field-input"
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                required
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span className="field-label">Merchant hint</span>
                <input
                  className="field-input"
                  value={merchantHint}
                  onChange={(event) => setMerchantHint(event.target.value)}
                  placeholder="Cafe, Uber, electricity bill"
                />
              </label>

              <label className="field">
                <span className="field-label">Amount hint</span>
                <input
                  className="field-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amountHint}
                  onChange={(event) => setAmountHint(event.target.value)}
                  placeholder="0.00"
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Uploading..." : "Upload receipt"}
              </button>
              <span className="form-message">{message}</span>
            </div>
          </form>
        </article>

        <aside className="panel">
          <h2 className="section-title">Automation path</h2>
          <p className="section-copy">
            This phase creates the capture lane for OCR, duplicate checks, and future one-click
            transaction creation.
          </p>
          <div className="checklist">
            <div className="checklist-item">
              <span className="check">1</span>
              <div>
                <div className="item-title">Capture receipt</div>
                <div className="item-subtitle">Store file metadata and review state.</div>
              </div>
            </div>
            <div className="checklist-item">
              <span className="check">2</span>
              <div>
                <div className="item-title">Suggest details</div>
                <div className="item-subtitle">Prepare merchant, amount, and category candidates.</div>
              </div>
            </div>
            <div className="checklist-item">
              <span className="check">3</span>
              <div>
                <div className="item-title">Review before posting</div>
                <div className="item-subtitle">Keep automation from changing the ledger silently.</div>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="panel">
        <h2 className="section-title">Receipt review queue</h2>
        <p className="section-copy">
          Uploaded receipts stay here until the next workflow turns them into transactions.
        </p>
        <div className="list">
          {receipts.length ? (
            receipts.map((receipt) => (
              <div className="list-item" key={receipt.id}>
                <div>
                  <div className="item-title">{receipt.merchant_name}</div>
                  <div className="item-subtitle">
                    {receipt.file_name} • {receipt.suggested_category_name ?? "No category"} •{" "}
                    {Math.round(receipt.confidence_score * 100)}% confidence
                  </div>
                  <div className="item-subtitle">{receipt.extracted_text.replace(/\n/g, " • ")}</div>
                </div>
                <div className="amount-income">
                  {receipt.suggested_amount ? formatCurrency(receipt.suggested_amount, "INR") : "Review"}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No receipts uploaded yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}
