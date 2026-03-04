type Props = {
  board: string;
  onMove: (position: number) => void;
  disabled?: boolean;
};

export default function Board({ board, onMove, disabled = false }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 100px)",
        gap: 8,
        marginBottom: 20,
      }}
    >
      {board.split("").map((cell, i) => (
        <button
          key={i}
          style={{
            height: 100,
            fontSize: 32,
            fontWeight: "bold",
            cursor: disabled || cell !== "." ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            backgroundColor: cell === "." ? "#f0f0f0" : "#e0e0e0",
            border: "2px solid #333",
            borderRadius: 8,
          }}
          onClick={() => onMove(i)}
          disabled={disabled || cell !== "."}
        >
          {cell === "." ? "" : cell}
        </button>
      ))}
    </div>
  );
}