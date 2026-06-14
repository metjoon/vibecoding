// Supabase Configuration
// 주의: GitHub에 코드를 올리기 전에 이 곳에 실제 URL과 KEY를 입력하세요.
const SUPABASE_URL = 'https://zmkcgfkpmvxwaresodme.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpta2NnZmtwbXZ4d2FyZXNvZG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MjQwNTQsImV4cCI6MjA5NzAwMDA1NH0.7PA4MHepau-bLHEmgJcvVuztVrnffEUDBjolqljupho';

// CDN 로드 실패 체크
if (!window.supabase) {
    alert("Supabase 라이브러리를 불러오지 못했습니다. 인터넷 연결이나 광고 차단기(AdBlock)를 잠시 꺼주세요.");
}

// 변수명 충돌을 피하기 위해 supabaseClient로 이름 변경
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const memoForm = document.getElementById('memoForm');
const memoList = document.getElementById('memoList');

let currentUser = null;

// Initialization
async function init() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            currentUser = session.user;
            showDashboard();
        } else {
            showLogin();
        }

        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange((_event, session) => {
            if (session) {
                currentUser = session.user;
                showDashboard();
            } else {
                currentUser = null;
                showLogin();
            }
        });
    } catch (err) {
        console.error("초기화 에러:", err);
    }
}

// UI State Management
function showLogin() {
    loginSection.style.display = 'flex';
    dashboardSection.style.display = 'none';
    logoutBtn.style.display = 'none';
}

function showDashboard() {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    logoutBtn.style.display = 'block';
    fetchMemos();
}

// Authentication
loginBtn.addEventListener('click', async () => {
    try {
        loginBtn.textContent = '로그인 중...';
        loginBtn.disabled = true;
        
        console.log('로그인 시작됨. 현재 URL:', window.location.href);
        
        let redirectUrl = window.location.origin + window.location.pathname;
        // file:/// 로 실행했을 경우 대비 예외 처리
        if (window.location.protocol === 'file:') {
            alert('로컬 파일(file:///)로 직접 열면 구글 로그인이 작동하지 않습니다. npx serve 를 이용하시거나 GitHub Pages 주소로 접속해주세요.');
            loginBtn.textContent = 'Google로 시작하기';
            loginBtn.disabled = false;
            return;
        }

        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl
            }
        });
        
        if (error) {
            console.error('OAuth 에러:', error);
            alert('로그인 중 오류가 발생했습니다: ' + error.message);
            loginBtn.textContent = 'Google로 시작하기';
            loginBtn.disabled = false;
        }
    } catch (err) {
        console.error('런타임 에러:', err);
        alert('알 수 없는 오류가 발생했습니다: ' + err.message);
        loginBtn.textContent = 'Google로 시작하기';
        loginBtn.disabled = false;
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
});

// Memo Logic
memoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const bookTitle = document.getElementById('bookTitle').value;
    const keySentence = document.getElementById('keySentence').value;
    const memoText = document.getElementById('memoText').value;
    const saveBtn = document.getElementById('saveBtn');
    
    saveBtn.textContent = '저장 중...';
    saveBtn.disabled = true;

    try {
        const { error } = await supabaseClient
            .from('book_memos')
            .insert([
                { 
                    user_id: currentUser.id, 
                    book_title: bookTitle, 
                    key_sentence: keySentence, 
                    memo: memoText 
                }
            ]);

        if (error) {
            console.error('데이터베이스 에러:', error);
            alert('메모 저장 중 오류가 발생했습니다: ' + error.message);
        } else {
            memoForm.reset();
            fetchMemos();
        }
    } catch (err) {
        console.error('저장 에러:', err);
        alert('저장 중 알 수 없는 오류가 발생했습니다.');
    }
    
    saveBtn.textContent = '메모 저장하기';
    saveBtn.disabled = false;
});

async function fetchMemos() {
    try {
        const { data: memos, error } = await supabaseClient
            .from('book_memos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('불러오기 에러:', error);
            return;
        }

        renderMemos(memos);
    } catch (err) {
        console.error('불러오기 런타임 에러:', err);
    }
}

// Expose deleteMemo globally for inline onclick
window.deleteMemo = async function(id) {
    if (!confirm('정말로 이 메모를 삭제하시겠습니까?')) return;

    try {
        const { error } = await supabaseClient
            .from('book_memos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('삭제 에러:', error);
            alert('삭제 중 오류가 발생했습니다: ' + error.message);
        } else {
            fetchMemos();
        }
    } catch (err) {
        console.error('삭제 런타임 에러:', err);
    }
}

function renderMemos(memos) {
    memoList.innerHTML = '';

    if (!memos || memos.length === 0) {
        memoList.innerHTML = `
            <div class="glass empty-state">
                <p style="font-size: 2rem; margin: 0 0 1rem 0; opacity: 0.5;">📖</p>
                <p>아직 기록된 도서 메모가 없습니다.</p>
                <p style="font-size: 0.9rem;">위에 폼을 통해 첫 번째 핵심 문장을 기록해보세요!</p>
            </div>
        `;
        return;
    }

    memos.forEach(memo => {
        const date = new Date(memo.created_at).toLocaleDateString('ko-KR');
        const memoHtml = `
            <div class="glass memo-card">
                <button onclick="window.deleteMemo('${memo.id}')" class="delete-btn" title="삭제">
                    🗑️
                </button>
                <div style="font-size: 0.85rem; color: #3b82f6; font-weight: 600; margin-bottom: 0.5rem;">
                    📖 ${memo.book_title}
                </div>
                <p style="font-size: 1.1rem; font-weight: 500; font-style: italic; margin: 0 0 1rem 0; line-height: 1.5;">
                    "${memo.key_sentence}"
                </p>
                ${memo.memo ? `<p style="font-size: 0.95rem; color: #cbd5e1; margin: 0; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px; flex: 1;">${memo.memo}</p>` : ''}
                <div style="font-size: 0.75rem; color: #64748b; margin-top: 1rem; text-align: right;">
                    ${date}
                </div>
            </div>
        `;
        memoList.innerHTML += memoHtml;
    });
}

// Start app
init();
