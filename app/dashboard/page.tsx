"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

type SharedMember = {
  name: string;
  paid: boolean;
};

type Subscription = {
  id: string | number;
  name: string;
  price: number;
  cycle: string;
  type: string;
  members: number | SharedMember[];
  renewalDate: string;
  category: string;
  paidBy?: string;
};

const COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#6366f1",
];

export default function Dashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editedName, setEditedName] = useState("");

  useEffect(() => {
  checkUserAndLoadData();

  const savedTheme = localStorage.getItem("darkMode");

  if (savedTheme === "true") {
    setDarkMode(true);
  }
}, []);

async function checkUserAndLoadData() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "/auth";
    return;
  }

  fetchSubscriptions();
}

  async function fetchSubscriptions() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "/auth";
    return;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching subscriptions:", error);
    return;
  }

  const formattedData = data.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    cycle: item.cycle,
    type: item.type,
    category: item.category || "Other",
    renewalDate: item.renewal_date,
    paidBy: item.paid_by,
    members: item.members || 1,
  }));

  setSubscriptions(formattedData);
}

  function toggleDarkMode() {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
  }

  async function deleteSubscription(id: string | number) {
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      alert("Failed to delete subscription.");
      return;
    }

    const updated = subscriptions.filter((sub) => sub.id !== id);
    setSubscriptions(updated);
  }

  function startEditing(sub: Subscription) {
    setEditingId(sub.id);
    setEditedName(sub.name);
  }

  async function saveEdit(id: string | number) {
    const { error } = await supabase
      .from("subscriptions")
      .update({ name: editedName })
      .eq("id", id);

    if (error) {
      console.error("Edit error:", error);
      alert("Failed to edit subscription.");
      return;
    }

    const updated = subscriptions.map((sub) =>
      sub.id === id ? { ...sub, name: editedName } : sub
    );

    setSubscriptions(updated);
    setEditingId(null);
    setEditedName("");
  }

  async function toggleMemberPaid(
    subscriptionId: string | number,
    memberIndex: number
  ) {
    const target = subscriptions.find((sub) => sub.id === subscriptionId);

    if (!target || !Array.isArray(target.members)) return;

    const updatedMembers = target.members.map((member, index) =>
      index === memberIndex ? { ...member, paid: !member.paid } : member
    );

    const { error } = await supabase
      .from("subscriptions")
      .update({ members: updatedMembers })
      .eq("id", subscriptionId);

    if (error) {
      console.error("Member update error:", error);
      alert("Failed to update member status.");
      return;
    }

    const updated = subscriptions.map((sub) =>
      sub.id === subscriptionId ? { ...sub, members: updatedMembers } : sub
    );

    setSubscriptions(updated);
  }

  function getDaysRemaining(dateString: string) {
    const today = new Date();
    const renewal = new Date(dateString);
    const diffTime = renewal.getTime() - today.getTime();

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function getMemberCount(sub: Subscription) {
    return Array.isArray(sub.members) ? sub.members.length : sub.members || 1;
  }

  function getPaidCount(sub: Subscription) {
    if (!Array.isArray(sub.members)) return 0;

    return sub.members.filter((member) => member.paid).length;
  }

  function getUnpaidCount(sub: Subscription) {
    if (!Array.isArray(sub.members)) return 0;

    return sub.members.filter((member) => !member.paid).length;
  }

  function getShareAmount(sub: Subscription) {
    return sub.price / getMemberCount(sub);
  }

  function exportCSV() {
    const headers = [
      "Name",
      "Price",
      "Cycle",
      "Type",
      "Category",
      "Renewal Date",
      "Paid By",
      "Members",
    ];

    const rows = filteredSubscriptions.map((sub) => [
      sub.name,
      sub.price,
      sub.cycle,
      sub.type,
      sub.category,
      sub.renewalDate,
      sub.paidBy || "",
      Array.isArray(sub.members)
        ? sub.members
            .map((member) => `${member.name}:${member.paid ? "paid" : "unpaid"}`)
            .join(" | ")
        : sub.members,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "subscriptions.csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesCategory =
        selectedCategory === "All" || sub.category === selectedCategory;

      const matchesSearch = sub.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [subscriptions, selectedCategory, searchTerm]);

  const monthlyTotal = filteredSubscriptions.reduce((total, sub) => {
    return total + (sub.cycle === "Monthly" ? sub.price : sub.price / 12);
  }, 0);

  const yearlyTotal = monthlyTotal * 12;

  const totalUnpaidShared = filteredSubscriptions.reduce((total, sub) => {
    if (!Array.isArray(sub.members)) return total;

    return total + getUnpaidCount(sub) * getShareAmount(sub);
  }, 0);

  const categoryTotals: Record<string, number> = {};

  filteredSubscriptions.forEach((sub) => {
    const monthlyValue = sub.cycle === "Monthly" ? sub.price : sub.price / 12;

    categoryTotals[sub.category] =
      (categoryTotals[sub.category] || 0) + monthlyValue;
  });

  const chartData = Object.entries(categoryTotals).map(([category, value]) => ({
    name: category,
    value,
  }));

  const barChartData = filteredSubscriptions.map((sub) => ({
    name: sub.name,
    value: sub.cycle === "Monthly" ? sub.price : sub.price / 12,
  }));

  const topCategory =
    Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "None";

  const highestSubscription = [...filteredSubscriptions].sort(
    (a, b) => b.price - a.price
  )[0];

  const pageBg = darkMode ? "bg-gray-950 text-white" : "bg-gray-100 text-black";
  const cardBg = darkMode ? "bg-gray-900 text-white" : "bg-white text-black";
  const mutedText = darkMode
  ? "text-gray-400"
  : "text-gray-600";

async function logout() {
  await supabase.auth.signOut();
  window.location.href = "/auth";
}
  return (
    <main className={`min-h-screen p-6 ${pageBg}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between mb-10">
          <div>
            <h1 className="text-5xl font-bold">SubNest Dashboard</h1>

            <p className={`mt-2 ${mutedText}`}>
              Smart subscription management for personal and shared payments.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={toggleDarkMode}
              className={`px-5 py-3 rounded-2xl font-semibold ${
                darkMode ? "bg-white text-black" : "bg-black text-white"
              }`}
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>

            <button
              onClick={exportCSV}
              className="bg-green-600 text-white px-5 py-3 rounded-2xl font-semibold"
            >
              Export CSV
            </button>

            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-2xl px-4 py-3 text-black"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border rounded-2xl px-4 py-3 text-black"
            >
              <option>All</option>
              <option>Entertainment</option>
              <option>AI Tools</option>
              <option>Music</option>
              <option>Utilities</option>
              <option>Shopping</option>
              <option>Gaming</option>
              <option>Productivity</option>
              <option>Other</option>
            </select>

            <button
  onClick={logout}
  className="bg-red-600 text-white px-5 py-3 rounded-2xl font-semibold"
>
  Logout
</button>

<a
  href="/add-subscription"
  className={`px-6 py-3 rounded-2xl font-semibold ${
    darkMode ? "bg-white text-black" : "bg-black text-white"
  }`}
>
  Add Subscription
</a>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">
          <div className={`${cardBg} rounded-3xl shadow p-6`}>
            <p className={mutedText}>Monthly Spend</p>
            <h2 className="text-4xl font-bold mt-2">
              ${monthlyTotal.toFixed(2)}
            </h2>
          </div>

          <div className={`${cardBg} rounded-3xl shadow p-6`}>
            <p className={mutedText}>Yearly Spend</p>
            <h2 className="text-4xl font-bold mt-2">
              ${yearlyTotal.toFixed(2)}
            </h2>
          </div>

          <div className={`${cardBg} rounded-3xl shadow p-6`}>
            <p className={mutedText}>Top Category</p>
            <h2 className="text-2xl font-bold mt-2">{topCategory}</h2>
          </div>

          <div className={`${cardBg} rounded-3xl shadow p-6`}>
            <p className={mutedText}>Highest Subscription</p>
            <h2 className="text-2xl font-bold mt-2">
              {highestSubscription?.name || "None"}
            </h2>
          </div>

          <div className={`${cardBg} rounded-3xl shadow p-6`}>
            <p className={mutedText}>Total Unpaid Shared</p>
            <h2 className="text-3xl font-bold mt-2 text-red-500">
              ${totalUnpaidShared.toFixed(2)}
            </h2>
          </div>
        </div>

        <div className="grid xl:grid-cols-2 gap-6 mb-10">
          <div className={`${cardBg} rounded-3xl shadow p-6`}>
            <h2 className="text-2xl font-bold mb-6">Category Distribution</h2>

            <div className="h-80 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label
                  >
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${cardBg} rounded-3xl shadow p-6`}>
            <h2 className="text-2xl font-bold mb-6">Subscription Costs</h2>

            <div className="h-80 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid xl:grid-cols-3 gap-6 mb-10">
          <div className="bg-yellow-100 text-black border border-yellow-300 rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-4">Upcoming Renewals</h2>

            <div className="space-y-3">
              {filteredSubscriptions.map((sub) => {
                const daysRemaining = getDaysRemaining(sub.renewalDate);

                return (
                  <div key={sub.id}>
                    {daysRemaining > 0 ? (
                      <p>
                        <span className="font-bold">{sub.name}</span> renews in{" "}
                        <span className="font-bold">
                          {daysRemaining} day(s)
                        </span>
                      </p>
                    ) : (
                      <p className="text-red-600">
                        <span className="font-bold">{sub.name}</span> renewal
                        overdue
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${cardBg} rounded-3xl shadow p-6 xl:col-span-2`}>
            <h2 className="text-2xl font-bold mb-6">Smart Insights</h2>

            <div className="space-y-4">
              <div className="border rounded-2xl p-4">
                You are spending approximately{" "}
                <span className="font-bold">${yearlyTotal.toFixed(2)}</span>{" "}
                per year.
              </div>

              <div className="border rounded-2xl p-4">
                Your highest spending category is{" "}
                <span className="font-bold">{topCategory}</span>.
              </div>

              <div className="border rounded-2xl p-4">
                Your unpaid shared balance is{" "}
                <span className="font-bold text-red-500">
                  ${totalUnpaidShared.toFixed(2)}
                </span>
                .
              </div>
            </div>
          </div>
        </div>

        {filteredSubscriptions.length === 0 ? (
          <div className={`${cardBg} rounded-3xl shadow p-10 text-center`}>
            <h2 className="text-2xl font-bold mb-2">
              No subscriptions found
            </h2>

            <p className={`${mutedText} mb-6`}>
              Try another category or search.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredSubscriptions.map((sub) => {
              const isSharedV2 = Array.isArray(sub.members);
              const memberCount = getMemberCount(sub);
              const shareAmount = getShareAmount(sub);
              const paidCount = getPaidCount(sub);
              const unpaidCount = getUnpaidCount(sub);

              return (
                <div
                  key={sub.id}
                  className={`${cardBg} rounded-3xl shadow p-6 flex flex-col gap-5`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        {editingId === sub.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="border rounded-xl px-3 py-2 text-black"
                            />

                            <button
                              onClick={() => saveEdit(sub.id)}
                              className="bg-green-600 text-white px-3 py-2 rounded-xl"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <h3 className="text-2xl font-bold">{sub.name}</h3>
                        )}

                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
                          {sub.category || "Other"}
                        </span>

                        {sub.type === "Shared" && (
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-700">
                            Shared
                          </span>
                        )}
                      </div>

                      <p className={`mt-1 ${mutedText}`}>
                        {sub.type} • {sub.cycle}
                      </p>

                      <p className={`mt-1 ${mutedText}`}>
                        Renewal Date:{" "}
                        {new Date(sub.renewalDate).toLocaleDateString()}
                      </p>

                      {sub.type === "Shared" && (
                        <p className={`mt-1 ${mutedText}`}>
                          Paid by:{" "}
                          <span className="font-semibold">
                            {sub.paidBy || "Not set"}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-3xl font-bold">${sub.price}</p>

                      {sub.type === "Shared" && (
                        <p className={mutedText}>
                          ${shareAmount.toFixed(2)} per person
                        </p>
                      )}

                      <div className="flex gap-3 justify-end mt-3">
                        <button
                          onClick={() => startEditing(sub)}
                          className="text-blue-500 text-sm underline"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteSubscription(sub.id)}
                          className="text-red-500 text-sm underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {sub.type === "Shared" && isSharedV2 && (
                    <div className="border-t pt-5">
                      <div className="grid md:grid-cols-4 gap-4 mb-5">
                        <div className="rounded-2xl bg-gray-100 text-black p-4">
                          <p className="text-sm text-gray-600">Members</p>
                          <p className="text-2xl font-bold">{memberCount}</p>
                        </div>

                        <div className="rounded-2xl bg-green-100 text-green-800 p-4">
                          <p className="text-sm">Paid</p>
                          <p className="text-2xl font-bold">{paidCount}</p>
                        </div>

                        <div className="rounded-2xl bg-red-100 text-red-800 p-4">
                          <p className="text-sm">Unpaid</p>
                          <p className="text-2xl font-bold">{unpaidCount}</p>
                        </div>

                        <div className="rounded-2xl bg-orange-100 text-orange-800 p-4">
                          <p className="text-sm">Unpaid Balance</p>
                          <p className="text-2xl font-bold">
                            ${(unpaidCount * shareAmount).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
  {Array.isArray(sub.members) &&
    sub.members.map((member, index) => (
                          <div
                            key={index}
                            className="border rounded-2xl p-4 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold">
                                {member.name || `Member ${index + 1}`}
                              </p>

                              <p className={mutedText}>
                                Owes ${shareAmount.toFixed(2)}
                              </p>
                            </div>

                            <button
                              onClick={() => toggleMemberPaid(sub.id, index)}
                              className={`px-3 py-2 rounded-xl text-sm font-semibold ${
                                member.paid
                                  ? "bg-green-600 text-white"
                                  : "bg-red-500 text-white"
                              }`}
                            >
                              {member.paid ? "Paid" : "Unpaid"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}