"use client";

export default function StatusBadge({ status }) {
  const styles = {
    Pending: "bg-yellow-100 text-yellow-700",
    Graded: "bg-green-100 text-green-700",
    Overdue: "bg-red-100 text-red-700",
    Active: "bg-green-100 text-green-700",
    Closed: "bg-gray-100 text-gray-600",
    Draft: "bg-yellow-100 text-yellow-700",
    Invited: "bg-yellow-100 text-yellow-700",
    Joined: "bg-green-100 text-green-700",
    Expired: "bg-red-100 text-red-700",
  };

  const style = styles[status] || "bg-gray-100 text-gray-600";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}
