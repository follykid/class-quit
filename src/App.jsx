import { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { ref, set, onValue, push, get, remove } from 'firebase/database';

function App() {
  const [role, setRole] = useState(null);
  const [currentQ, setCurrentQ] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);
  const [seatNumber, setSeatNumber] = useState(""); 
  const [allResponses, setAllResponses] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  
  // 狀態設定
  const [quizCount] = useState(10); // 預設 10 題
  const [tempBank, setTempBank] = useState({}); 
  const options = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  // 監聽雲端資料
  useEffect(() => {
    const gameRef = ref(db, 'current_game');
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentQ(data.question_id);
        setCorrectAnswer(data.answer);
        setHasAnswered(false);
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

  // 老師功能：儲存題庫
  const saveQuizBank = () => {
    set(ref(db, 'quiz_bank'), tempBank);
    alert("題庫已成功儲存至雲端！");
  };

  // 老師功能：重設所有資料
  const clearAllData = () => {
    if(window.confirm("確定要清空所有作答紀錄嗎？")) {
      remove(ref(db, 'responses'));
      set(ref(db, 'current_game'), null);
      alert("數據已重設");
    }
  };

  // 老師功能：發送題目
  const sendQuestionWithBank = async (qId) => {
    const bankRef = ref(db, `quiz_bank/${qId}`);
    const snapshot = await get(bankRef);
    const ans = snapshot.exists() ? snapshot.val() : "";
    if (!ans) return alert(`請先在左側設定 ${qId} 的答案！`);

    set(ref(db, 'current_game'), { 
      question_id: qId, 
      answer: ans, 
      status: "voting" 
    });
  };

  // 學生功能：繳交答案
  const submitAnswer = (choice) => {
    if (!seatNumber || !currentQ) return;
    push(ref(db, `responses/${currentQ}`), {
      name: `${seatNumber}號`,
      answer: choice,
      isCorrect: choice === correctAnswer,
      time: Date.now()
    });
    setHasAnswered(true);
  };

  // 初始角色選擇頁面
  if (!role) {
    return (
      <div style={layoutStyle}>
        <h1 style={{color: '#333'}}>🎓 課堂即時反饋系統</h1>
        <p>請選擇您的身份</p>
        <button onClick={() => setRole('teacher')} style={btnStyle}>我是老師 (控制台)</button>
        <button onClick={() => setRole('student')} style={{...btnStyle, marginLeft: '10px', backgroundColor: '#4CAF50'}}>我是學生 (作答區)</button>
      </div>
    );
  }

  return (
    <div style={layoutStyle}>
      {role === 'teacher' ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
          
          {/* 左側：題庫設定 */}
          <div style={{ ...cardStyle, textAlign: 'left', width: '320px' }}>
            <h3 style={{marginTop: 0}}>⚙️ 1. 設定答案 (10個選項)</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {Array.from({ length: quizCount }, (_, i) => `Q${i+1}`).map(q => (
                <div key={q} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>{q}</strong> 正解：</span>
                  <select onChange={(e) => setTempBank({...tempBank, [q]: e.target.value})}>
                    <option value="">--</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button onClick={saveQuizBank} style={{ ...btnStyle, backgroundColor: '#f39c12', width: '100%', marginTop: '15px' }}>儲存這 10 題答案</button>
            <button onClick={clearAllData} style={{ ...btnStyle, backgroundColor: '#666', width: '100%', marginTop: '10px', fontSize: '12px' }}>清空所有作答數據</button>
          </div>

          {/* 右側：發題監控 */}
          <div style={{ width: '450px' }}>
            <div style={cardStyle}>
              <h3 style={{marginTop: 0}}>📢 2. 推播題目</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {Array.from({ length: quizCount }, (_, i) => `Q${i+1}`).map(q => (
                  <button key={q} onClick={() => sendQuestionWithBank(q)} style={{ ...btnStyle, padding: '8px 0' }}>{q}</button>
                ))}
              </div>
              <hr style={{margin: '20px 0', border: '0.5px solid #eee'}} />
              <h4>目前題目：<span style={{color: '#0070f3'}}>{currentQ || "未發題"}</span> (正解：{correctAnswer || "?"})</h4>
              <div style={{ textAlign: 'left', maxHeight: '300px', overflowY: 'auto', backgroundColor: '#fafafa', padding: '10px', borderRadius: '8px' }}>
                {allResponses.length === 0 ? <p style={{color: '#999', textAlign: 'center'}}>尚未有人繳交...</p> : 
                  allResponses.map((res, i) => (
                    <div key={i} style={{ padding: '5px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>{res.name}</strong></span>
                      <span>選 {res.answer} {res.isCorrect ? '✅' : '❌'}</span>
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
            <div>
              <h3>請選擇你的座號</h3>
              <div style={gridStyle}>
                {Array.from({ length: 26 }, (_, i) => i + 1).map(num => (
                  <button key={num} onClick={() => setSeatNumber(num)} style={seatBtnStyle}>{num}</button>
                ))}
              </div>
            </div>
          ) : (
            <div style={cardStyle}>
              <p style={{fontSize: '20px'}}>座號：<strong>{seatNumber}</strong></p>
              {!hasAnswered ? (
                currentQ ? (
                  <div>
                    <p>請回答：{currentQ}</p>
                    <div style={optionsGrid}>
                      {options.map(choice => (
                        <button key={choice} onClick={() => submitAnswer(choice)} style={optionBtnStyle}>{choice}</button>
                      ))}
                    </div>
                  </div>
                ) : <p style={{color: '#999'}}>☕ 等待老師發題...</p>
              ) : (
                <div style={{padding: '20px'}}>
                  <p style={{color: 'green', fontSize: '24px', fontWeight: 'bold'}}>✅ 答案已送出！</p>
                </div>
              )}
              <button onClick={() => setSeatNumber("")} style={{marginTop: '30px', background: 'none', border: 'none', color: '#999', textDecoration: 'underline', cursor: 'pointer'}}>重選座號</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- 樣式修復 (解決 LayoutStyle is not defined) ---
const layoutStyle = { textAlign: 'center', padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' };
const btnStyle = { padding: '12px 20px', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' };
const cardStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', display: 'inline-block', verticalAlign: 'top' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', maxWidth: '350px', margin: '20px auto' };
const seatBtnStyle = { padding: '15px 5px', fontSize: '18px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', fontWeight: 'bold' };
const optionsGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '20px' };
const optionBtnStyle = { padding: '15px', fontSize: '20px', cursor: 'pointer', borderRadius: '10px', border: '2px solid #0070f3', backgroundColor: 'white', color: '#0070f3', fontWeight: 'bold' };

export default App;