// client/src/TeacherImport.jsx
import { useState } from "react";
import Papa from "papaparse";
import { fs } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";

function parseCorrectIndex(ansRaw, options) {
  const ans = String(ansRaw ?? "").trim();

  // 0~3
  if (/^[0-3]$/.test(ans)) return Number(ans);

  // 1~4 -> 0~3
  if (/^[1-4]$/.test(ans)) return Number(ans) - 1;

  // A~D
  if (/^[ABCD]$/i.test(ans)) return "ABCD".indexOf(ans.toUpperCase());

  // 用「選項文字」比對
  const idx = options.indexOf(ans);
  return idx;
}

/**
 * Firestore batch 限制：每批最多 500 個 write/delete。
 * 這裡做「分批刪除」：把某個 collection 下所有 docs 刪掉。
 */
async function deleteAllDocsInCollection(colRef) {
  const snap = await getDocs(colRef);
  if (snap.empty) return 0;

  let deleted = 0;
  let batch = writeBatch(fs);
  let opCount = 0;

  for (const d of snap.docs) {
    batch.delete(d.ref);
    opCount++;
    deleted++;

    if (opCount >= 450) {
      await batch.commit();
      batch = writeBatch(fs);
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }

  return deleted;
}

export default function TeacherImport() {
  const [bankId, setBankId] = useState("default");
  const [msg, setMsg] = useState("");
  const [mode, setMode] = useState("append"); // append | replace

  const onFile = (file) => {
    setMsg("parsing...");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data, errors }) => {
        if (errors?.length) return setMsg("CSV 解析失敗");

        try {
          const qCol = collection(fs, "questionBanks", bankId, "questions");
          const aCol = collection(fs, "questionBanks", bankId, "answerKeys");

          // ✅ replace：先清掉舊題庫（questions + answerKeys）
          if (mode === "replace") {
            setMsg("replace：刪除舊題庫中...");
            const dq = await deleteAllDocsInCollection(qCol);
            const da = await deleteAllDocsInCollection(aCol);
            setMsg(`replace：已刪除 questions=${dq}、answerKeys=${da}，開始匯入...`);
          } else {
            setMsg("append：開始匯入...");
          }

          let ok = 0;
          let skipped = 0;
          const badPreview = [];

          for (const row of data) {
            const question = String(row.question ?? "").trim();
            const options = [row.A, row.B, row.C, row.D].map((v) =>
              String(v ?? "").trim()
            );
            const correctIndex = parseCorrectIndex(row.answer, options);

            const optionsOk =
              options.length === 4 && options.every((x) => x.length > 0);
            const ciOk =
              Number.isInteger(correctIndex) &&
              correctIndex >= 0 &&
              correctIndex < 4 &&
              options[correctIndex]?.length > 0;

            if (!question || !optionsOk || !ciOk) {
              skipped++;
              if (badPreview.length < 8) {
                badPreview.push({
                  question,
                  A: options[0],
                  B: options[1],
                  C: options[2],
                  D: options[3],
                  answer: row.answer,
                  correctIndex,
                });
              }
              continue;
            }

            // 產生同一個 docId，分別寫 questions / answerKeys
            const qRef = doc(qCol); // auto id
            const now = serverTimestamp();

            // 題目內容（不放 correctIndex）
            await setDoc(qRef, {
              category: String(row.category ?? "一般").trim(),
              question,
              options,
              explanation: String(row.explanation ?? "").trim(),
              imgUrl: String(row.imgUrl ?? "").trim(),
              createdAt: now,
              updatedAt: now,
            });

            // 答案表（只放 correctIndex）
            await setDoc(doc(aCol, qRef.id), {
              correctIndex,
              createdAt: now,
              updatedAt: now,
            });

            ok++;
          }

          setMsg(
            `mode=${mode}\n` +
              `imported ${ok} questions into bankId=${bankId}\n` +
              `skipped ${skipped} invalid rows\n` +
              (badPreview.length
                ? `\nPreview of skipped:\n${JSON.stringify(badPreview, null, 2)}`
                : "")
          );
        } catch (e) {
          console.error(e);
          setMsg(`匯入失敗：${String(e)}`);
        }
      },
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Teacher Import (Firestore)</h2>

      <div>Bank ID（題庫代碼）</div>
      <input
        value={bankId}
        onChange={(e) => setBankId(e.target.value)}
        style={{ padding: 8, width: 260 }}
      />

      <div style={{ marginTop: 12 }}>匯入模式</div>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        style={{ padding: 8, width: 260 }}
      >
        <option value="append">追加（append）</option>
        <option value="replace">覆蓋（replace：先刪舊題庫）</option>
      </select>

      <div style={{ marginTop: 12 }}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </div>

      <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{msg}</pre>
    </div>
  );
}