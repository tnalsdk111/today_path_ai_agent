import { randomUUID } from "node:crypto";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

const BASE_URL = process.env.AGENT_BASE_URL ?? "http://localhost:3000";
const conversationId = randomUUID();

async function send(message) {
  const res = await fetch(`${BASE_URL}/api/agent/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation_id: conversationId, message }),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { error: text };
  }
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  console.log(`agent chat  ${BASE_URL}`);
  console.log(`conversation_id: ${conversationId}`);
  console.log("동 이름을 입력한 뒤 조건을 이어서 입력하세요. 종료: exit\n");

  const rl = readline.createInterface({ input, output });
  try {
    while (true) {
      const line = (await rl.question("you> ")).trim();
      if (!line) continue;
      if (["exit", "quit", "q"].includes(line.toLowerCase())) break;

      const { ok, status, data } = await send(line);
      const label = data.status ?? (ok ? "ok" : `http ${status}`);
      const message =
        data.message ?? data.error ?? JSON.stringify(data, null, 2);
      console.log(`\nagent [${label}]\n${message}\n`);
    }
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  console.error("npm run dev 가 켜져 있는지 확인하세요.");
  process.exit(1);
});
