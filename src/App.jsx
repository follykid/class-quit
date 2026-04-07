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
  
  const [quizCount, setQuizCount] = useState(10); // 預設 10 題
  const [tempBank, setTempBank] = useState({}); 

  // 定義 10 個選項：A 到 J
  const options = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

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

  const saveQuizBank = () => {
    set(ref(db, 'quiz_bank'), tempBank);
    alert("題庫已儲存！");
  };

  const clearAllData = () => {
    if(window.confirm("確定要清空數據嗎？")) {
      remove(ref(db, 'responses'));
      set(ref(db, 'current_game'), null);
      alert("已重設");
    }
  };

  const sendQuestionWithBank = async (qId) => {
    const bankRef = ref(db, `quiz_bank/${qId}`);
    const snapshot = await get(bankRef);
    const ans = snapshot.exists() ? snapshot.val() : "";
    if (!ans) return alert(`請先設定 ${qId} 的答案！`);
    set(ref(db, 'current_game'), { question_id: qId, answer: ans });
  };

  const submitAnswer = (choice) => {
    if (!seatNumber) return;
    push(ref(db, `responses/${currentQ}`), {
      name: `${seatNumber}號`,
      answer: choice,
      isCorrect: choice === correctAnswer,
      time: Date.now()
    });
    setHasAnswered(true);
  };

  if (!role) {
    return (
      <div style={layoutStyle}>
        <h1>🎓 課堂即時系統 (10選項版)</h1>
        <button onClick={() => setRole('teacher')} style={btnStyle}>老師端</button>
        <button onClick={() => setRole('student')} style={{...btnStyle, marginLeft: '10px', backgroundColor: '#4CAF50'}}>學生端</button>
      </div>
    );
  }

  return (
    <div style={layoutStyle}>
      {role === 'teacher' ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
          {/* 左側：設定區 */}
          <div style={{ ...cardStyle, width: '320px', textAlign: 'left' }}>
            <h3>⚙️ 設定題庫答案</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {Array.from({ length: quizCount }, (_, i) => `Q${i+1}`).map(q => (
                <div key={q} style={{ marginBottom: '10px' }}>
                  <span>{q} 答案：</span>
                  <select onChange={(e) => setTempBank({...tempBank, [q]: e.target.value})}>
                    <option value="">選正解</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button onClick={saveQuizBank} style={{ ...btnStyle, width: '100%', marginTop: '10px', backgroundColor: '#f39c12' }}>儲存題庫</button>
            <button onClick={clearAllData} style={{ ...btnStyle, width: '100%', marginTop: '10px', backgroundColor: '#666' }}>清空紀錄</button>
          </div>

          {/* 右側：監控區 */}
          <div style={{ width: '450px' }}>
            <div style={cardStyle}>
              <h3>📢 目前題目：{currentQ}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
                {Array.from({ length: quizCount }, (_, i) => `Q${i+1}`).map(q => (
                  <button key={q} onClick={() => sendQuestionWithBank(q)} style={{...btnStyle, padding: '5px'}}>{q}</button>
                ))}
              </div>
              <hr/>
              <div style={{ textAlign: 'left' }}>
                {allResponses.map((res, i) => (
                  <div key={i} style={{ borderBottom: '1px solid #eee' }}>
                    {res.name}: <span style={{fontWeight:'bold'}}>{res.answer}</span> {res.isCorrect ? '✅' : '❌'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 學生端：顯示 A ~ J 按鈕 */
        <div>
          <h2>📱 學生作答</h2>
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
                  <div style={optionsGrid}>
                    {options.map(choice => (
                      <button key={choice} onClick={() => submitAnswer(choice)} style={optionBtnStyle}>{choice}</button>
                    ))}
                  </div>
                ) : <p>等待發題...</p>
              ) : <p style={{color: 'green', fontSize: '24px'}}>✅ 已送出！</p>}
              <button onClick={() => setSeatNumber("")} style={{marginTop: '20px', fontSize: '12px'}}>重選座號</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 樣式
const layoutStyle = { textAlign: 'center', padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' };
const btnStyle = { padding: '10px 15px', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' };
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', maxWidth: '350px', margin: '20px auto' };
const seatBtnStyle = { padding: '15px 5px', fontSize: '18px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff' };

// 10 個選項按鈕的專屬網格樣式
const optionsGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '20px' };
const optionBtnStyle = { padding: '15px', fontSize: '20px', cursor: 'pointer', borderRadius: '10px', border: '2px solid #0070f3', backgroundColor: 'white', fontWeight: 'bold' };

export default App;