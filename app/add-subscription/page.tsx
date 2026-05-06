"use client";
import { supabase } from "@/lib/supabase";

import { useState } from "react";

type Member = {
  name: string;
  paid: boolean;
};

export default function AddSubscription() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [cycle, setCycle] = useState("Monthly");
  const [type, setType] = useState("Personal");
  const [renewalDate, setRenewalDate] = useState("");
  const [category, setCategory] = useState("Entertainment");

  const [paidBy, setPaidBy] = useState("");
  const [memberCount, setMemberCount] = useState(2);

  const [members, setMembers] = useState<Member[]>([
    { name: "", paid: false },
    { name: "", paid: false },
  ]);

  function updateMemberName(index: number, value: string) {
    const updatedMembers = [...members];

    updatedMembers[index].name = value;

    setMembers(updatedMembers);
  }

  function togglePaid(index: number) {
    const updatedMembers = [...members];

    updatedMembers[index].paid =
      !updatedMembers[index].paid;

    setMembers(updatedMembers);
  }

  function handleMemberCountChange(count: number) {
    setMemberCount(count);

    const updatedMembers = [...members];

    while (updatedMembers.length < count) {
      updatedMembers.push({
        name: "",
        paid: false,
      });
    }

    while (updatedMembers.length > count) {
      updatedMembers.pop();
    }

    setMembers(updatedMembers);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newSubscription = {
      id: Date.now(),
      name,
      price: Number(price),
      cycle,
      type,
      renewalDate,
      category,
      paidBy,
      members,
    };

    const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  alert("You must be logged in.");
  return;
}

const { error } = await supabase.from("subscriptions").insert([
  {
    user_id: user.id,
    name,
    price: Number(price),
    cycle,
    type,
    renewal_date: renewalDate,
    category,
    paid_by: paidBy,
    members,
  },
]);

if (error) {
  console.error("Error saving subscription:", error);
  alert("Something went wrong while saving.");
  return;
}

alert("Subscription saved to Supabase!");

    setName("");
    setPrice("");
    setCycle("Monthly");
    setType("Personal");
    setRenewalDate("");
    setCategory("Entertainment");
    setPaidBy("");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-10">
        <h1 className="text-4xl font-bold mb-8">
          Add Subscription
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <input
            type="text"
            placeholder="Subscription Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="w-full border rounded-2xl p-4"
            required
          />

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            className="w-full border rounded-2xl p-4"
            required
          />

          <select
            value={cycle}
            onChange={(e) =>
              setCycle(e.target.value)
            }
            className="w-full border rounded-2xl p-4"
          >
            <option>Monthly</option>
            <option>Yearly</option>
          </select>

          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value)
            }
            className="w-full border rounded-2xl p-4"
          >
            <option>Personal</option>
            <option>Shared</option>
          </select>

          <input
            type="date"
            value={renewalDate}
            onChange={(e) =>
              setRenewalDate(e.target.value)
            }
            className="w-full border rounded-2xl p-4"
            required
          />

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            className="w-full border rounded-2xl p-4"
          >
            <option>Entertainment</option>
            <option>AI Tools</option>
            <option>Music</option>
            <option>Utilities</option>
            <option>Shopping</option>
            <option>Gaming</option>
            <option>Productivity</option>
            <option>Other</option>
          </select>

          {type === "Shared" && (
            <div className="border rounded-3xl p-6 space-y-5">
              <h2 className="text-2xl font-bold">
                Shared Members
              </h2>

              <input
                type="text"
                placeholder="Paid By"
                value={paidBy}
                onChange={(e) =>
                  setPaidBy(e.target.value)
                }
                className="w-full border rounded-2xl p-4"
              />

              <div>
                <label className="font-semibold">
                  Number of Members
                </label>

                <input
                  type="number"
                  min="2"
                  value={memberCount}
                  onChange={(e) =>
                    handleMemberCountChange(
                      Number(e.target.value)
                    )
                  }
                  className="w-full border rounded-2xl p-4 mt-2"
                />
              </div>

              <div className="space-y-4">
                {members.map((member, index) => (
                  <div
                    key={index}
                    className="border rounded-2xl p-4"
                  >
                    <input
                      type="text"
                      placeholder={`Member ${
                        index + 1
                      } Name`}
                      value={member.name}
                      onChange={(e) =>
                        updateMemberName(
                          index,
                          e.target.value
                        )
                      }
                      className="w-full border rounded-xl p-3 mb-3"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        togglePaid(index)
                      }
                      className={`px-4 py-2 rounded-xl font-semibold ${
                        member.paid
                          ? "bg-green-600 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {member.paid
                        ? "Paid"
                        : "Unpaid"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white py-4 rounded-2xl font-bold"
          >
            Save Subscription
          </button>
        </form>
      </div>
    </main>
  );
}