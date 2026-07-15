export type SplitType = "equal" | "percentage" | "custom";

export type SplitMember = {
  user_id: string;
  full_name: string;
};

export type SplitFormLike = {
  amount: string;
  split_type: SplitType;
  splits: Record<string, string>;
};

export type SplitPreviewItem = {
  user_id: string;
  full_name: string;
  amount_owed: number;
};

function toMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function addLeftoverToPayer(items: SplitPreviewItem[], amount: number, payerId: string) {
  const targetTotal = Math.round(amount * 100);
  const currentTotal = items.reduce((sum, item) => sum + Math.round(item.amount_owed * 100), 0);
  const leftover = targetTotal - currentTotal;
  if (!leftover) {
    return items;
  }

  const payerIndex = Math.max(
    0,
    items.findIndex((item) => item.user_id === payerId),
  );
  return items.map((item, index) =>
    index === payerIndex ? { ...item, amount_owed: toMoney(item.amount_owed + leftover / 100) } : item,
  );
}

export function validateSplitTotal(form: SplitFormLike, members: SplitMember[] | null) {
  if (!members?.length) {
    return "Select a group first.";
  }
  if (!Number(form.amount || 0) || Number(form.amount || 0) <= 0) {
    return "Enter an expense amount.";
  }
  if (form.split_type === "equal") {
    return "";
  }

  const total = members.reduce((sum, member) => sum + Number(form.splits[member.user_id] || 0), 0);
  if (form.split_type === "percentage" && Math.abs(total - 100) > 0.5) {
    return "Percentage splits must total 100.";
  }
  if (form.split_type === "custom" && Math.abs(total - Number(form.amount || 0)) > 0.01) {
    return "Custom splits must total the expense amount.";
  }
  return "";
}

export function getSplitInputTotal(form: SplitFormLike, members: SplitMember[] | null) {
  if (!members?.length || form.split_type === "equal") {
    return 0;
  }
  return members.reduce((sum, member) => sum + Number(form.splits[member.user_id] || 0), 0);
}

export function buildSplitPreview(
  amount: number,
  members: SplitMember[],
  splitType: SplitType,
  splits: Record<string, string>,
  payerId: string,
) {
  if (!members.length || amount <= 0) {
    return [];
  }

  if (splitType === "equal") {
    const share = amount / members.length;
    const items = members.map((member) => ({
      user_id: member.user_id,
      full_name: member.full_name,
      amount_owed: toMoney(share),
    }));
    return addLeftoverToPayer(items, amount, payerId);
  }

  if (splitType === "percentage") {
    const items = members.map((member) => ({
      user_id: member.user_id,
      full_name: member.full_name,
      amount_owed: toMoney((amount * Number(splits[member.user_id] || 0)) / 100),
    }));
    return addLeftoverToPayer(items, amount, payerId);
  }

  return members.map((member) => ({
    user_id: member.user_id,
    full_name: member.full_name,
    amount_owed: toMoney(Number(splits[member.user_id] || 0)),
  }));
}
