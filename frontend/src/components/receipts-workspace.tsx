"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

import { createReceiptTransaction, getAccounts, getCategories, getReceipts, uploadReceipt } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Category, PaymentAccount, Receipt } from "@/lib/types";

type ReceiptDraft = {
  account_id: string;
  account_name: string;
  category_id: string;
  amount: string;
  transaction_date: string;
  payment_method: string;
  description: string;
  notes: string;
};

const today = new Date().toISOString().slice(0, 10);

export function ReceiptsWorkspace() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [merchantHint, setMerchantHint] = useState("");
  const [amountHint, setAmountHint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postingReceiptId, setPostingReceiptId] = useState<string | null>(null);
  const [draftReceiptId, setDraftReceiptId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReceiptDraft | null>(null);
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

  const loadReviewOptions = useCallback(async () => {
    try {
      const [nextCategories, nextAccounts] = await Promise.all([getCategories(), getAccounts()]);
      setCategories(nextCategories);
      setAccounts(nextAccounts);
    } catch {
      setMessage("Receipt review options are not connected yet.");
    }
  }, []);

  useEffect(() => {
    void loadReceipts();
    void loadReviewOptions();
  }, [loadReceipts, loadReviewOptions]);

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

  const reviewReadyCount = receipts.filter((receipt) => receipt.status === "review_ready").length;
  const postedCount = receipts.filter((receipt) => receipt.status === "posted").length;
  const duplicateWatchCount = receipts.filter((receipt) => receipt.duplicate_count > 0).length;
  const averageConfidence = receipts.length
    ? receipts.reduce((sum, receipt) => sum + receipt.confidence_score, 0) / receipts.length
    : 0;
  const expenseCategories = categories.filter((category) => category.type === "expense");
  const defaultAccount = accounts.find((account) => account.is_default) ?? accounts[0];

  function beginReview(receipt: Receipt) {
    const categoryId = receipt.suggested_category_id ?? expenseCategories[0]?.id ?? "";
    setDraftReceiptId(receipt.id);
    setDraft({
      account_id: defaultAccount?.id ?? "",
      account_name: defaultAccount?.name ?? "Primary Wallet",
      category_id: categoryId,
      amount: receipt.suggested_amount ? String(receipt.suggested_amount) : "",
      transaction_date: today,
      payment_method: "UPI",
      description: `Imported from ${receipt.file_name}`,
      notes: `Reviewed from receipt upload: ${receipt.file_name}`,
    });
    setMessage(`Reviewing ${receipt.merchant_name}.`);
  }

  async function postReceipt(receipt: Receipt) {
    if (!draft || draftReceiptId !== receipt.id) {
      beginReview(receipt);
      return;
    }
    if (!draft.amount || !draft.category_id || !draft.account_id) {
      setMessage("Add amount, category, and account before posting this receipt.");
      return;
    }

    setPostingReceiptId(receipt.id);
    setMessage("Posting receipt as an expense...");

    try {
      await createReceiptTransaction(receipt.id, {
        account_id: draft.account_id,
        account_name: draft.account_name,
        category_id: draft.category_id,
        amount: Number(draft.amount),
        transaction_date: draft.transaction_date,
        payment_method: draft.payment_method,
        description: draft.description,
        notes: draft.notes,
      });
      setDraft(null);
      setDraftReceiptId(null);
      await loadReceipts("Receipt posted to the expense ledger.");
    } catch {
      setMessage("Could not post this receipt. Please review the details and try again.");
    } finally {
      setPostingReceiptId(null);
    }
  }

  return (
    <main className="page-shell">
      <div className="page-header-compact">
        <div>
          <h1>Receipts</h1>
          <p className="page-header-subtitle">Capture, review, and post receipts to your ledger</p>
        </div>
      </div>

      <div className="balance-summary-card">
        <div>
          <div className="balance-summary-label">Receipts processed</div>
          <div className="balance-summary-value">{receipts.length}</div>
          <div className="balance-summary-footnote">{reviewReadyCount} ready for review - {postedCount} posted</div>
        </div>
      </div>

      <section className="grid stats-grid stats-grid-3">
        <article className="panel stat-card">
          <div className="stat-label">Avg confidence</div>
          <div className="stat-value">{Math.round(averageConfidence * 100)}%</div>
          <div className="stat-footnote">Current automation confidence</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Duplicate watch</div>
          <div className="stat-value">{duplicateWatchCount}</div>
          <div className="stat-footnote">Receipts matching recent expenses</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Awaiting review</div>
          <div className="stat-value">{reviewReadyCount}</div>
          <div className="stat-footnote">Not yet posted to your ledger</div>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <h2 className="section-title">Upload receipt</h2>
          <p className="section-copy">
            Attach an image or PDF receipt — we&apos;ll extract the details automatically. Add hints only if you want to override what we detect.
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
            This flow captures receipt metadata, suggests details, checks for duplicates, and posts
            approved receipts into the ledger.
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
                <div className="item-title">Post to ledger</div>
                <div className="item-subtitle">Review details, then create the expense.</div>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="panel">
        <h2 className="section-title">Receipt review queue</h2>
        <p className="section-copy">
          Review the extracted details, watch for possible duplicates, and post approved receipts as expenses.
        </p>
        <div className="receipt-grid">
          {receipts.length ? (
            receipts.map((receipt) => (
              <article className="receipt-card" key={receipt.id}>
                <div className="receipt-card-top">
                  <div>
                    <div className="item-title">{receipt.merchant_name}</div>
                    <div className="item-subtitle">
                      {receipt.file_name} • {receipt.suggested_category_name ?? "No category"} •{" "}
                      {Math.round(receipt.confidence_score * 100)}% confidence
                    </div>
                  </div>
                  <span className={receipt.status === "posted" ? "status-pill status-posted" : "status-pill"}>
                    {receipt.status === "posted" ? "Posted" : "Review ready"}
                  </span>
                </div>

                <div className="receipt-meta-row">
                  <span className="receipt-amount">
                    {receipt.suggested_amount ? formatCurrency(receipt.suggested_amount, "INR") : "Needs amount"}
                  </span>
                  {receipt.duplicate_count > 0 ? (
                    <span className="duplicate-pill">{receipt.duplicate_count} possible duplicate</span>
                  ) : (
                    <span className="quiet-pill">No recent duplicate</span>
                  )}
                </div>

                <div className="item-subtitle">{receipt.extracted_text.replace(/\n/g, " • ")}</div>

                {draftReceiptId === receipt.id && draft ? (
                  <div className="receipt-review-form">
                    <div className="field-row">
                      <label className="field">
                        <span className="field-label">Amount</span>
                        <input
                          className="field-input"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={draft.amount}
                          onChange={(event) => setDraft((current) => current ? { ...current, amount: event.target.value } : current)}
                          required
                        />
                      </label>
                      <label className="field">
                        <span className="field-label">Date</span>
                        <input
                          className="field-input"
                          type="date"
                          value={draft.transaction_date}
                          onChange={(event) =>
                            setDraft((current) => current ? { ...current, transaction_date: event.target.value } : current)
                          }
                          required
                        />
                      </label>
                    </div>

                    <div className="field-row">
                      <label className="field">
                        <span className="field-label">Account</span>
                        <select
                          className="field-input"
                          value={draft.account_id}
                          onChange={(event) => {
                            const account = accounts.find((item) => item.id === event.target.value);
                            setDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    account_id: event.target.value,
                                    account_name: account?.name ?? current.account_name,
                                  }
                                : current,
                            );
                          }}
                          required
                        >
                          {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span className="field-label">Category</span>
                        <select
                          className="field-input"
                          value={draft.category_id}
                          onChange={(event) =>
                            setDraft((current) => current ? { ...current, category_id: event.target.value } : current)
                          }
                          required
                        >
                          {expenseCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="field">
                      <span className="field-label">Payment method</span>
                      <input
                        className="field-input"
                        value={draft.payment_method}
                        onChange={(event) =>
                          setDraft((current) => current ? { ...current, payment_method: event.target.value } : current)
                        }
                        required
                      />
                    </label>
                  </div>
                ) : null}

                <div className="receipt-actions">
                  {receipt.status === "posted" ? (
                    <span className="form-message">Already saved to expenses.</span>
                  ) : (
                    <>
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => beginReview(receipt)}
                      >
                        Review
                      </button>
                      <button
                        className="button button-primary"
                        type="button"
                        disabled={postingReceiptId === receipt.id}
                        onClick={() => postReceipt(receipt)}
                      >
                        {postingReceiptId === receipt.id ? "Posting..." : "Post expense"}
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">No receipts uploaded yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}
