import React from "react";

interface Transaction {
  from: string;
  to: string;
  amount: number;
  reason?: string;
  timestamp: string | Date;
  message?: string;
}

const TransactionEntry: React.FC<{ transaction: Transaction }> = ({
  transaction,
}) => {
  const { from, to, amount, reason, timestamp, message } = transaction;

  const renderContent = () => {
    if (message) {
      const parts = message.split(/(\bAnonymous Komrade\b|\b\w+\b)/g);
      return parts.map((part, index) => {
        if (part === from || part === to) {
          return (
            <span key={index} style={{ color: "red" }}>
              {part}
            </span>
          );
        }
        if (part.match(/^\d+cr$/)) {
          return <strong key={index}>{part}</strong>;
        }
        return part;
      });
    }

    return (
      <>
        <span style={{ color: "red" }}>{from}</span> →{" "}
        <span style={{ color: "red" }}>{to}</span> : <strong>{amount}cr</strong>
        {reason && ` (${reason})`}
      </>
    );
  };

  return (
    <li className="py-2">
      <div className="text-[11px] sm:text-xs font-mono opacity-80">
        {new Date(timestamp).toLocaleString()}
      </div>
      <div className="text-xs sm:text-sm font-mono mt-1 leading-relaxed break-words">
        {renderContent()}
      </div>
    </li>
  );
};

export default TransactionEntry;
