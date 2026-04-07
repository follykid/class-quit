import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, set, onValue, push } from 'firebase/database';

function App() {
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizBank, setQuizBank] = useState({});
  const [answers, setAnswers] = useState({});
  const [textInput, setTextInput] = useState('');

  const options = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  useEffect(() => {
    onValue(ref(db, 'currentQuiz'), (snapshot) => setCurrentQuiz(snapshot.val()));
    onValue(ref(db, 'quizBank'), (snapshot) => setQuizBank(snapshot.val() || {}));
    onValue(ref(db, 'answers'), (snapshot) => setAnswers(snapshot.val() || {}));
  }, []);

  const handleLogin = () => {
    if (password === '1234') setRole('teacher');
    else alert('密碼錯誤');
  };

  const updateBank = (qId, val) => {
    set(ref(db, `quizBank/${qId}`), val);
  };

  const sendQuiz = (type, qId = null) => {
    const quizData = {
      type,
      qId,
      correctAnswer: qId ? (quizBank[qId] || "") : "",
      timestamp: Date.now()
    };
    set(ref(db, 'currentQuiz'), quizData);
    set(ref(db, 'answers'), {}); // 發新題時清空全班答案
    setTextInput('');
  };

  const submitAnswer = (ans) => {
    if (!seatNumber) return alert('請先輸入座號');
    set(ref(db, `answers/${seatNumber}`), {
      answer: ans,
      isCorrect: currentQuiz?.type === 'choice' ? (ans === currentQuiz.correctAnswer) : null
    });
  };

  // 計算成績邏輯：比對全班所有座號在 10 題中的表現
  const calculateScores = () => {
    const scores = {};
    // 假設班級座號 1-30
    for (let i = 1; i <= 30; i++) {
      let correctCount = 0;
      Object.keys(quizBank).forEach(qId => {
        // 這裡需要更複雜的歷史紀錄邏輯，目前簡化為顯示當前答題狀態
      });
    }
    // 轉換成列表並排序
    return Object.entries(answers)
      .map(([seat, data]) => ({
        seat,
        ans: data.answer,
        score: data.isCorrect ? 100 : 0 // 單題制先以100分計
      }))
      .sort((a, b) => b.score - a.score);
  };

  if (!role) {
    return (
      <div style={layoutStyle}>
        <h1>🎓 課堂全功能互動系統</h1>
        <button onClick={() => setRole('student')} style={btnStyle}>我是學生</button>
        <div style={{ marginTop: '20px' }}>
          <input type="password" placeholder="老師密碼" onChange={e => setPassword(e.target.value)} style={inputStyle} />
          <button onClick={handleLogin} style={{ ...btnStyle, backgroundColor: '#444' }}>老師登入</button>
        </div>
      </div>
    );
  }

  if (role === 'teacher') {
    const scoreList = calculateScores();
    return (
      <div style={{ ...layoutStyle, maxWidth: '1200px' }}>
        <h2>👨‍🏫 老師管理控制台</h2>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'flex-start' }}>
          
          {/* 1. 設定正解區 (這是補回來的！) */}
          <div style={{ ...cardStyle, width: '220px', textAlign: 'left' }}>
            <h3 style={{marginTop: 0}}>⚙️ 設定正解</h3>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {Array.from({ length: 10 }, (_, i) => `Q${i+1}`).map(q => (
                <div key={q} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{q}:</span>
                  <select value={quizBank[q] || ""} onChange={e => updateBank(q, e.target.value)}>
                    <option value="">選答案</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* 2. 發送指令區 */}
          <div style={{ ...cardStyle, width: '350px' }}>
            <h3 style={{marginTop: 0}}>📢 發送指令</h3>
            <div style={gridStyle}>
              {Array.from({ length: 10 }, (_, i) => `Q${i+1}`).map(q => (
                <button key={q} onClick={() => sendQuiz('choice', q)} style={seatBtnStyle}>
                  選{q}
                </button>
              ))}
            </div>
            <button onClick={() => sendQuiz('text')} style={{ ...btnStyle, backgroundColor: '#9b59b6', marginTop: '20px', width: '100%' }}>
              發送填充題
            </button>
            <button onClick={() => set(ref(db, 'currentQuiz'), null)} style={{ ...btnStyle, backgroundColor: '#e74c3c', marginTop: '10px', width: '100%' }}>
              停止測驗/清空畫面
            </button>
          </div>

          {/* 3. 成績總覽區 */}
          <div style={{ ...cardStyle, flex: 1 }}>
            <h3 style={{marginTop: 0}}>🏆 全班成績總覽</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={thStyle}>座號</th>
                  <th style={thStyle}>學生答案</th>
                  <th style={thStyle}>得分</th>
                </tr>
              </thead>
              <tbody>
                {scoreList.map(item => (
                  <tr key={item.seat} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}>{item.seat}</td>
                    <td style={tdStyle}>{item.ans}</td>
                    <td style={{ ...tdStyle, color: item.score === 100 ? 'green' : 'red', fontWeight: 'bold' }}>
                      {item.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {scoreList.length === 0 && <p style={{color: '#999'}}>尚無學生作答...</p>}
          </div>

        </div>
      </div>
    );
  }

  // 學生端介面
  return (
    <div style={layoutStyle}>
      {!seatNumber ? (
        <div style={cardStyle}>
          <h3>請輸入座號開始</h3>
          <input type="number" placeholder="你的座號" onBlur={e => setSeatNumber(e.target.value)} style={inputStyle} />
        </div>
      ) : (
        <div style={cardStyle}>
          <h2>座號: {seatNumber}</h2>
          <hr />
          {currentQuiz ? (
            <div>
              <h3>題目類型: {currentQuiz.type === 'choice' ? `選擇題 (${currentQuiz.qId})` : '填充題'}</h3>
              {currentQuiz.type === 'choice' ? (
                <div style={optionsGrid}>
                  {options.map(o => (
                    <button key={o} onClick={() => submitAnswer(o)} style={optionBtnStyle}>{o}</button>
                  ))}
                </div>
              ) : (
                <div>
                  <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)} style={inputStyle} />
                  <button onClick={() => submitAnswer(textInput)} style={btnStyle}>送出填充答案</button>
                </div>
              )}
            </div>
          ) : <p>☕ 老師尚未出題</p>}
        </div>
      )}
    </div>
  );
}

// 樣式設定
const layoutStyle = { textAlign: 'center', padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' };
const btnStyle = { padding: '12px 20px', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '10px', width: '200px', fontSize: '16px' };
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' };
const seatBtnStyle = { padding: '15px 5px', fontSize: '14px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff' };
const optionsGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' };
const optionBtnStyle = { padding: '20px', fontSize: '20px', cursor: 'pointer', borderRadius: '10px', border: '1px solid #ddd' };
const thStyle = { padding: '10px', textAlign: 'left', color: '#666', fontSize: '13px' };
const tdStyle = { padding: '10px', fontSize: '15px' };

export default App;