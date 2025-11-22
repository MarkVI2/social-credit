import React from "react";
import DOMPurify from "isomorphic-dompurify";

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
      // Sanitize and render HTML produced by message templates
      const clean = DOMPurify.sanitize(message, {
        ALLOWED_TAGS: ["span", "b", "strong", "em"],
        ALLOWED_ATTR: ["class"],
      });
      return <span dangerouslySetInnerHTML={{ __html: clean }} />;
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
