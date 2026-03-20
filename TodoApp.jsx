import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import TodoListABI from "./TodoListABI.json";

const CONTRACT_ADDRESS = "0xdA38bf156E4C531783274d2d3976aBc711AE7C6F";

function normalizeTasks(raw) {
  // raw items contain BigInt fields (id, createdAt, completedAt)
  return raw.map((t) => ({
    id: Number(t.id),
    description: t.description,
    createdAt: Number(t.createdAt),
    completed: Boolean(t.completed),
    completedAt: Number(t.completedAt),
    isPrivate: Boolean(t.isPrivate),
    owner: t.owner,
  }));
}

export default function TodoApp() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [status, setStatus] = useState("");

  const hasAddress = useMemo(
    () => typeof CONTRACT_ADDRESS === "string" && CONTRACT_ADDRESS.startsWith("0x"),
    []
  );

  const loadTasks = async (c) => {
    const raw = await c.getTasks();
    setTasks(normalizeTasks(raw));
  };

  const connect = async () => {
    setStatus("");
    if (!window.ethereum) {
      setStatus("MetaMask not found. Please install MetaMask.");
      return;
    }
    if (!hasAddress) {
      setStatus("Missing VITE_TODOLIST_ADDRESS in .env");
      return;
    }

    const provider = new BrowserProvider(window.ethereum);

    // Prompt MetaMask connection
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const addr = await signer.getAddress();
    setAccount(addr);

    const c = new Contract(CONTRACT_ADDRESS, TodoListABI, signer);
    setContract(c);

    await loadTasks(c);
  };

  useEffect(() => {
    // auto-connect attempt (will still need user approval in MetaMask)
    connect().catch((e) => setStatus(e?.shortMessage || e?.message || String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTask = async () => {
    try {
      setStatus("");
      if (!contract) return;
      const desc = newTask.trim();
      if (!desc) return;

      //const tx = await contract.addTask(desc);
      const tx = await contract.addTask(desc, isPrivate);
      setStatus("Waiting for transaction confirmation...");
      await tx.wait();

      setNewTask("");
      await loadTasks(contract);
      setStatus("Task added.");
    } catch (e) {
      setStatus(e?.shortMessage || e?.message || String(e));
    }
  };

  const completeTask = async (taskId) => {
    try {
      setStatus("");
      if (!contract) return;

      // NOTE: your Solidity uses _taskId as an array index (and id increments from 0),
      // so id == index for your current contract behavior.
      const tx = await contract.completeTask(taskId);
      setStatus("Waiting for transaction confirmation...");
      await tx.wait();

      await loadTasks(contract);
      setStatus("Task completed.");
    } catch (e) {
      setStatus(e?.shortMessage || e?.message || String(e));
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>TodoList (Smart Contract)</h1>

      <div style={{ marginBottom: 12 }}>
        <button onClick={connect}>Connect MetaMask</button>
        {account && (
          <span style={{ marginLeft: 10, fontSize: 14 }}>
            Connected: {account.slice(0, 6)}…{account.slice(-4)}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          style={{ flex: 1, padding: 8 }}
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="New task description…"
        />
        Private?
        <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
        <button onClick={addTask}>Add</button>
      </div>

      <ul style={{ paddingLeft: 18 }}>
        {tasks.map((t) => (
          <li key={t.id} style={{ marginBottom: 8 }}>
            <span style={{ marginRight: 8 }}>
              {t.description} {t.completed ? "✔️" : ""}
            </span>
            {!t.completed && (
              <button onClick={() => completeTask(t.id)}>Complete</button>
            )}
          </li>
        ))}
      </ul>

      {status && (
        <div style={{ marginTop: 14, padding: 10, background: "#f3f3f3" }}>
          {status}
        </div>
      )}
    </div>
  );
}
