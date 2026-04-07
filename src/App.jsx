import { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { ref, set, onValue, push, get, remove } from 'firebase/database';

function App() {
  const [role, setRole] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [currentQ, setCurrentQ] = useState("");
  const [mode, setMode] = useState("choice"); // choice 或 text
  const [hasAnswered, setHasAnswered] = useState(false);
  const [seatNumber, setSeatNumber] = useState(""); 
  const [allResponses, setAllResponses] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [textInput, setTextInput] = useState(""); 
  
  const TEACHER_PASSWORD = "1234"; // 你可以在這裡修改老師登入密碼
  const options = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  useEffect(() => {
    const gameRef = ref(db, 'current_game');
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentQ(data.question_id);
        setCorrectAnswer(data.answer);
        setMode(data.mode || "choice");
        setHasAnswered(false);
        setTextInput("");
        if (data.question_id) {
          const resRef = ref(db, `responses/${data.question_id}`);
          onValue(resRef, (resSnapshot) => {
            const resData = resSnapshot.val();
            setAllResponses(resData ? Object.values(resData) : []);
          });
        }
      }
    });
  }, []);

  const handleTeacherLogin = () => {
    if (passwordInput === TEACHER_PASSWORD) setIsAuth(true);
    else alert("密碼錯誤！");
  };

  const sendQuestion = async (qId, qMode) => {
    let ans = "";
    if (qMode === "choice") {
      const bankRef = ref(db, `quiz_bank/${qId}`);
      const snapshot = await get(bankRef);
      ans = snapshot.exists() ? snapshot.val() : "";
      if (!ans) return alert(`請先設定 ${qId} 的選擇題正解！`);
    }
    set(ref(db, 'current_game'), { question_id: qId, answer: ans, mode: qMode });
  };

  const submitAnswer = (ansValue) => {
    if (!seatNumber || !currentQ || !ansValue.trim()) return;
    push(ref(db, `responses/${currentQ}`), {
      name: `${seatNumber}號`,
      answer: ansValue,
      isCorrect: mode === "choice" ? ansValue === correctAnswer : "N/A",
      time: Date.now()
    });
    setHasAnswered(true);
  };

  if (!role) {
    return (
      <div style={layoutStyle}>
        <h1 style={{color: '#333'}}>🎓 課堂全功能互動系統</h1>
        <button onClick={() => setRole('teacher')} style={btnStyle}>我是老師</button>
        <button onClick={() => setRole('student')} style={{...btnStyle, marginLeft: '10px', backgroundColor: '#4CAF50'}}>我是學生</button>
      </div>
    );
  }

  if (role === 'teacher' && !isAuth) {
    return (
      <div style={layoutStyle}>
        <div style={cardStyle}>
          <h3>🔐 老師管理驗證</h3>
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} style={inputStyle} placeholder="請輸入密碼" />
          <button onClick={handleTeacherLogin} style={{...btnStyle, width: '100%'}}>登入</button>
        </div>
      </div>
    );
  }

  return (
    <div style={layoutStyle}>
      {role === 'teacher' ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
          <div style={{ ...cardStyle, width: '320px', textAlign: 'left' }}>
            <h3 style={{marginTop: 0}}>📢 發送指令</h3>
            <p style={{fontSize: '13px', color: '#666'}}>選擇題模式 (A-J)：</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
              {Array.from({ length: 10 }, (_, i) => `Q${i+1}`).map(q => (
                <button key={q} onClick={() => sendQuestion(q, "choice")} style={{...btnStyle, padding: '5px', fontSize: '11px'}}>選{q}</button>
              ))}
            </div>
            <p style={{fontSize: '13px', color: '#666', marginTop: '15px'}}>填充題模式 (文字)：</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
              {Array.from({ length: 10 }, (_, i) => `T${i+1}`).map(q => (
                <button key={q} onClick={() => sendQuestion(q, "text")} style={{...btnStyle, padding: '5px', fontSize: '11px', backgroundColor: '#9c27b0'}}>填{q}</button>
              ))}
            </div>
            <button onClick={() => remove(ref(db, 'responses'))} style={{...btnStyle, backgroundColor: '#666', width: '100%', marginTop: '20px'}}>清空所有作答數據</button>
          </div>

          <div style={{ width: '450px' }}>
            <div style={cardStyle}>
              <h3 style={{marginTop: 0}}>📋 學生作答即時 Print</h3>
              <p>目前題目：<strong>{currentQ || "未開始"}</strong> | 模式：<strong>{mode === 'choice' ? '選擇題' : '填充題'}</strong></p>
              <div style={printAreaStyle}>
                {allResponses.length === 0 ? <p style={{color: '#ccc'}}>等待數據傳入...</p> : 
                  allResponses.map((res, i) => (
                    <div key={i} style={printLineStyle}>
                      <span style={{color: '#0070f3', fontWeight: 'bold'}}>{res.name}</span>
                      <span style={{marginLeft: '15px', color: '#333'}}>{res.answer}</span>
                      {mode === 'choice' && (res.isCorrect ? ' ✅' : ' ❌')}
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 學生端介面 */
        <div>
          <h2>📱 學生作答區</h2>
          {!seatNumber ? (
            <div style={gridStyle}>
              {Array.from({ length: 26 }, (_, i) => i + 1).map(num => (
                <button key={num} onClick={() => setSeatNumber(num)} style={seatBtnStyle}>{num}</button>
              ))}
            </div>
          ) : (
            <div style={cardStyle}>
              <p>座號：<strong>{seatNumber}</strong></p>
              {!hasAnswered ? (
                currentQ ? (
                  mode === "choice" ? (
                    <div style={optionsGrid}>
                      {options.map(choice => <button key={choice} onClick={() => submitAnswer(choice)} style={optionBtnStyle}>{choice}</button>)}
                    </div>
                  ) : (
                    <div>
                      <p>請輸入填充題答案：</p>
                      <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} style={inputStyle} placeholder="請輸入文字..." />
                      <button onClick={() => submitAnswer(textInput)} style={{...btnStyle, width: '100%'}}>提交答案</button>
                    </div>
                  )
                ) : <p>☕ 老師尚未出題</p>
              ) : <p style={{color: 'green', fontSize: '20px', fontWeight: 'bold'}}>已成功送出答案！</p>}
              <button onClick={() => setSeatNumber("")} style={{marginTop: '30px', border: 'none', background: 'none', color: '#999', textDecoration: 'underline'}}>重選座號</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- 樣式設定 ---
const layoutStyle = { textAlign: 'center', padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' };
const btnStyle = { padding: '12px 20px', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '10px', width: '90%', fontSize: '16px' };
const cardStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', display: 'inline-block', verticalAlign: 'top' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', maxWidth: '350px', margin: '20px auto' };
const seatBtnStyle = { padding: '15px 5px', fontSize: '18px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', fontWeight: 'bold' };
const optionsGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '20px' };
const optionBtnStyle = { padding: '15px', fontSize: '20px', cursor: 'pointer', borderRadius: '10px', border: '2px solid #0070f3', backgroundColor: 'white', color: '#0070f3', fontWeight: 'bold' };
const printAreaStyle = { textAlign: 'left', maxHeight: '450px', overflowY: 'auto', backgroundColor: '#fafafa', padding: '15px', borderRadius: '10px', border: '1px solid #eee' };
const printLineStyle = { padding: '10px 0', borderBottom: '1px solid #eee', fontSize: '18px', fontFamily: 'monospace' };

export default App;