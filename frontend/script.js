// API 설정 - 설정 파일에서 가져오기
const API_BASE_URL = window.RUBRIC_CONFIG ? window.RUBRIC_CONFIG.API_BASE_URL : '/api';

// DOM 요소들
const form = document.getElementById('rubricForm');
const submitBtn = document.getElementById('submitBtn');
const submitBtnText = document.getElementById('submitBtnText');
const loadingOverlay = document.getElementById('loadingOverlay');
const resultsSection = document.getElementById('resultsSection');
const nameInput = document.getElementById('name');
const submissionInput = document.getElementById('student_submission');
const exportSheetsBtn = document.getElementById('exportSheets');

// 탭 관련 요소들
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// 콘텐츠 표시 영역들
const rubricContent = document.getElementById('rubricContent');
const evaluationContent = document.getElementById('evaluationContent');
const feedbackContent = document.getElementById('feedbackContent');
const reportContent = document.getElementById('reportContent');

// 현재 결과 데이터 저장
let currentResults = null;
let currentTeacherInput = null;

// 유틸리티 함수들
function generateThreadId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function showLoading() {
    loadingOverlay.style.display = 'flex';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>처리 중...</span>';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
    submitBtn.disabled = false;
    // 버튼을 원래 상태로 복원
    submitBtn.innerHTML = '<i class="fas fa-magic"></i> <span id="submitBtnText">루브릭 생성</span>';
    // 새로운 요소를 다시 가져와서 업데이트
    const newSubmitBtnText = document.getElementById('submitBtnText');
    const hasStudentInfo = nameInput.value.trim() || submissionInput.value.trim();
    if (hasStudentInfo) {
        newSubmitBtnText.textContent = '루브릭 생성 및 평가';
    } else {
        newSubmitBtnText.textContent = '루브릭 생성';
    }
}

function updateSubmitButton() {
    const hasStudentInfo = nameInput.value.trim() || submissionInput.value.trim();
    if (hasStudentInfo) {
        submitBtnText.textContent = '루브릭 생성 및 평가';
    } else {
        submitBtnText.textContent = '루브릭 생성';
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    
    // 기존 에러 메시지 제거
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // 폼 위에 에러 메시지 추가
    form.parentNode.insertBefore(errorDiv, form);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    // 기존 성공 메시지 제거
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    // 결과 섹션 위에 성공 메시지 추가
    resultsSection.parentNode.insertBefore(successDiv, resultsSection);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

function formatMarkdownContent(content) {
    // 마크다운 코드 블록 제거
    let formatted = content.replace(/```markdown\n?/g, '').replace(/```\n?/g, '');
    
    // 테이블을 HTML로 변환
    formatted = formatMarkdownTable(formatted);
    
    return formatted;
}

function formatMarkdownTable(content) {
    // 마크다운 테이블을 HTML 테이블로 변환
    const lines = content.split('\n');
    let htmlContent = '';
    let inTable = false;
    let tableRows = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('|') && line.split('|').length > 2) {
            if (!inTable) {
                inTable = true;
                tableRows = [];
            }
            
            // 구분선 스킵 (---|---|--- 형태)
            if (line.includes('---')) {
                continue;
            }
            
            const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
            tableRows.push(cells);
        } else {
            if (inTable) {
                // 테이블 종료, HTML 테이블 생성
                htmlContent += createHtmlTable(tableRows);
                tableRows = [];
                inTable = false;
            }
            
            if (line) {
                // 일반 텍스트 처리
                if (line.startsWith('#')) {
                    const level = line.match(/^#+/)[0].length;
                    const text = line.replace(/^#+\s*/, '');
                    htmlContent += `<h${level}>${text}</h${level}>\n`;
                } else {
                    htmlContent += `<p>${line}</p>\n`;
                }
            } else {
                htmlContent += '\n';
            }
        }
    }
    
    // 마지막에 테이블이 있는 경우 처리
    if (inTable && tableRows.length > 0) {
        htmlContent += createHtmlTable(tableRows);
    }
    
    return htmlContent;
}

function createHtmlTable(rows) {
    if (rows.length === 0) return '';
    
    let html = '<table>\n';
    
    // 첫 번째 행을 헤더로 처리
    if (rows.length > 0) {
        html += '<thead>\n<tr>\n';
        rows[0].forEach(cell => {
            html += `<th>${cell}</th>\n`;
        });
        html += '</tr>\n</thead>\n';
    }
    
    // 나머지 행들을 바디로 처리
    if (rows.length > 1) {
        html += '<tbody>\n';
        for (let i = 1; i < rows.length; i++) {
            html += '<tr>\n';
            rows[i].forEach(cell => {
                html += `<td>${cell}</td>\n`;
            });
            html += '</tr>\n';
        }
        html += '</tbody>\n';
    }
    
    html += '</table>\n';
    return html;
}

// 탭 전환 기능
function initializeTabs() {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // 모든 탭 버튼과 패널에서 active 클래스 제거
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // 클릭된 탭과 해당 패널에 active 클래스 추가
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// 폼 제출 처리
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // 폼 데이터 수집
    const formData = new FormData(form);
    const name = formData.get('name').trim();
    const studentSubmission = formData.get('student_submission').trim();
    const hasStudentInfo = name || studentSubmission;
    
    // teacher_input 구성
    let teacherInput = `topic: ${formData.get('topic')}\nobjective: ${formData.get('objective')}\ngrade_level: ${formData.get('grade_level')}학년`;
    
    if (hasStudentInfo) {
        teacherInput += `\nname: ${name || '익명'}\nstudent_submission: ${studentSubmission}`;
    }
    
    // 현재 교사 입력 정보 저장
    currentTeacherInput = {
        topic: formData.get('topic'),
        objective: formData.get('objective'),
        grade_level: formData.get('grade_level'),
        name: name,
        student_submission: studentSubmission
    };
    
    const data = {
        teacher_input: teacherInput,
        thread_id: generateThreadId()
    };
    
    try {
        showLoading();
        
        // API 호출
        const response = await fetch(`${API_BASE_URL}/rubric`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            displayResults(result.generated_results, hasStudentInfo);
            const message = hasStudentInfo ? '루브릭 생성 및 평가가 완료되었습니다!' : '루브릭 생성이 완료되었습니다!';
            showSuccess(message);
            
            // 결과 섹션으로 스크롤
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            throw new Error('API 응답에서 오류가 발생했습니다.');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError(`오류가 발생했습니다: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// 복사 기능
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> 복사됨!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('복사 실패:', err);
        // 폴백: 텍스트 선택
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> 복사됨!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2000);
    });
}

function addCopyButton(container, content) {
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.innerHTML = '<i class="fas fa-copy"></i> 복사';
    copyButton.onclick = () => copyToClipboard(content, copyButton);
    container.appendChild(copyButton);
}


// 구글 시트 내보내기 함수
function exportToGoogleSheets() {
    if (!currentResults || !currentTeacherInput) {
        showError('내보낼 결과가 없습니다. 먼저 루브릭을 생성해주세요.');
        return;
    }

    try {
        // TSV (Tab-Separated Values) 형식으로 데이터 생성
        let tsvContent = '';
        
        // 기본 정보 섹션 (테이블 형태)
        tsvContent += '🎯 루브릭 에이전트 평가 결과\t\t\n';
        tsvContent += '\t\t\n';
        tsvContent += '항목\t내용\t\n';
        tsvContent += '📅 생성 날짜\t' + new Date().toLocaleString('ko-KR') + '\t\n';
        tsvContent += '📚 주제\t' + (currentTeacherInput.topic || '') + '\t\n';
        tsvContent += '🎯 목적\t' + (currentTeacherInput.objective || '') + '\t\n';
        tsvContent += '🎓 학년\t' + (currentTeacherInput.grade_level ? currentTeacherInput.grade_level + '학년' : '') + '\t\n';
        tsvContent += '👤 학생 이름\t' + (currentTeacherInput.name || '미입력') + '\t\n';
        tsvContent += '\t\t\n';

        // 루브릭 섹션
        if (currentResults.rubric) {
            tsvContent += '📏 루브릭\t\t\n';
            tsvContent += '\t\t\n';
            tsvContent += convertMarkdownTableToTSV(currentResults.rubric);
            tsvContent += '\t\t\n';
        }

        // 학생 정보가 있는 경우에만 평가 관련 내용 추가
        if (currentTeacherInput.name || currentTeacherInput.student_submission) {
            if (currentResults.evaluation) {
                tsvContent += '📊 평가 결과\t\t\n';
                tsvContent += '\t\t\n';
                tsvContent += convertMarkdownTableToTSV(currentResults.evaluation);
                tsvContent += '\t\t\n';
            }

            if (currentResults.feedback) {
                tsvContent += '💬 피드백\t\t\n';
                tsvContent += '\t\t\n';
                tsvContent += convertMarkdownTableToTSV(currentResults.feedback);
                tsvContent += '\t\t\n';
            }

            if (currentResults.report) {
                tsvContent += '📄 종합 리포트\t\t\n';
                tsvContent += '\t\t\n';
                tsvContent += convertMarkdownTableToTSV(currentResults.report);
                tsvContent += '\t\t\n';
            }
        }

        // 구글 시트 URL 생성
        const googleSheetsUrl = `https://docs.google.com/spreadsheets/create?usp=sheets_web_ug_dm&hl=ko`;
        
        // 새 탭에서 구글 시트 열기
        window.open(googleSheetsUrl, '_blank');
        
        // 클립보드에 데이터 복사
        copyToClipboard(tsvContent, exportSheetsBtn);
        
        setTimeout(() => {
            alert('구글 시트가 새 탭에서 열렸습니다.\n\n✅ 테이블 형식 데이터가 클립보드에 복사되었습니다.\n📋 구글 시트에서 Ctrl+V로 붙여넣기만 하면 자동으로 테이블이 생성됩니다!\n\n🎉 별도 설정 없이 바로 사용 가능합니다.');
        }, 1000);
        
    } catch (error) {
        console.error('Google Sheets export error:', error);
        showError('구글 시트 내보내기 중 오류가 발생했습니다.');
    }
}

// 마크다운 테이블을 TSV로 변환 (구글 시트용)
function convertMarkdownTableToTSV(markdown) {
    let tsvContent = '';
    const lines = markdown.split('\n').filter(line => line.trim());
    
    let inTable = false;
    let hasTable = false;
    
    for (let line of lines) {
        line = line.trim();
        
        // 헤더 처리
        if (line.startsWith('#')) {
            const text = line.replace(/^#+\s*/, '');
            if (hasTable) tsvContent += '\t\t\n'; // 테이블 후 공백
            tsvContent += text + '\t\t\n';
            continue;
        }
        
        // 테이블 처리
        if (line.includes('|') && line.split('|').length > 2) {
            // 구분선 스킵
            if (line.includes('---')) {
                continue;
            }
            
            const cells = line.split('|')
                .map(cell => cell.trim().replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1'))
                .filter(cell => cell !== '');
            
            // TSV 형식으로 변환 (탭으로 구분)
            tsvContent += cells.join('\t') + '\n';
            inTable = true;
            hasTable = true;
        } else if (inTable) {
            inTable = false;
            tsvContent += '\t\t\n'; // 테이블 끝에 빈 줄
        } else if (line && !line.includes('|')) {
            // 일반 텍스트를 키-값 쌍으로 처리
            const cleanLine = line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
            
            if (cleanLine.includes(':')) {
                const [key, ...valueParts] = cleanLine.split(':');
                const value = valueParts.join(':').trim();
                tsvContent += key.trim() + '\t' + value + '\n';
            } else {
                tsvContent += cleanLine + '\t\t\n';
            }
        }
    }
    
    return tsvContent;
}

// 마크다운 테이블을 CSV로 변환 (레거시)
function convertMarkdownTableToCSV(markdown) {
    let csvContent = '';
    const lines = markdown.split('\n').filter(line => line.trim());
    
    let inTable = false;
    
    for (let line of lines) {
        line = line.trim();
        
        // 헤더 처리
        if (line.startsWith('#')) {
            const text = line.replace(/^#+\s*/, '');
            csvContent += text + '\n';
            continue;
        }
        
        // 테이블 처리
        if (line.includes('|') && line.split('|').length > 2) {
            // 구분선 스킵
            if (line.includes('---')) {
                continue;
            }
            
            const cells = line.split('|')
                .map(cell => cell.trim().replace(/"/g, '""'))
                .filter(cell => cell !== '');
            
            csvContent += '"' + cells.join('","') + '"\n';
            inTable = true;
        } else if (inTable) {
            inTable = false;
            csvContent += '\n';
        } else if (line && !line.includes('|')) {
            // 일반 텍스트
            const cleanLine = line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
            csvContent += cleanLine + '\n';
        }
    }
    
    return csvContent;
}


// 마크다운을 CSV용으로 정리
function cleanMarkdownForCSV(text) {
    return text
        .replace(/```markdown\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#+\s*/g, '')
        .replace(/"/g, '""')              // CSV 이스케이프
        .trim();
}

// 마크다운을 엑셀 테이블로 변환 (구글 시트와 동일한 구조)

// 마크다운을 엑셀 데이터로 파싱 (레거시 - 호환성을 위해 유지)
function parseMarkdownToExcelData(markdown, title) {
    const data = [[title], []];
    const lines = markdown
        .replace(/```markdown\n?/g, '')
        .replace(/```\n?/g, '')
        .split('\n')
        .filter(line => line.trim());

    let inTable = false;
    let tableHeaders = [];

    for (let line of lines) {
        line = line.trim();
        
        // 헤더 처리
        if (line.startsWith('#')) {
            const level = line.match(/^#+/)[0].length;
            const text = line.replace(/^#+\s*/, '');
            data.push([]);
            data.push([`${'  '.repeat(level - 1)}${text}`]);
            continue;
        }

        // 테이블 처리
        if (line.includes('|') && line.split('|').length > 2) {
            const cells = line.split('|')
                .map(cell => cell.trim())
                .filter(cell => cell !== '');

            // 구분선 스킵
            if (line.includes('---')) {
                continue;
            }

            if (!inTable) {
                inTable = true;
                tableHeaders = cells;
                data.push([]);
                data.push(cells); // 헤더 행
            } else {
                data.push(cells); // 데이터 행
            }
            continue;
        } else {
            inTable = false;
        }

        // 일반 텍스트 처리
        if (line && !line.includes('|')) {
            // 볼드, 이탤릭 제거
            line = line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
            
            if (line.includes(':')) {
                // 키:값 형태 처리
                const [key, ...valueParts] = line.split(':');
                const value = valueParts.join(':').trim();
                data.push([key.trim(), value]);
            } else {
                data.push([line]);
            }
        }
    }

    return data;
}

// 결과 표시
function displayResults(results, hasStudentInfo = true) {
    // 현재 결과 저장
    currentResults = results;
    
    // 루브릭 표시 (항상 표시)
    if (results.rubric) {
        const formattedRubric = formatMarkdownContent(results.rubric);
        rubricContent.innerHTML = formattedRubric;
        addCopyButton(rubricContent, results.rubric);
    }
    
    // 학생 정보가 있을 때만 평가 관련 탭들 표시
    const evaluationTab = document.querySelector('[data-tab="evaluation"]');
    const feedbackTab = document.querySelector('[data-tab="feedback"]');
    const reportTab = document.querySelector('[data-tab="report"]');
    
    if (hasStudentInfo) {
        // 평가 표시
        if (results.evaluation) {
            const formattedEvaluation = formatMarkdownContent(results.evaluation);
            evaluationContent.innerHTML = formattedEvaluation;
            addCopyButton(evaluationContent, results.evaluation);
        }
        
        // 피드백 표시
        if (results.feedback) {
            const formattedFeedback = formatMarkdownContent(results.feedback);
            feedbackContent.innerHTML = formattedFeedback;
            addCopyButton(feedbackContent, results.feedback);
        }
        
        // 리포트 표시
        if (results.report) {
            const formattedReport = formatMarkdownContent(results.report);
            reportContent.innerHTML = formattedReport;
            addCopyButton(reportContent, results.report);
        }
        
        // 모든 탭 표시
        evaluationTab.style.display = 'flex';
        feedbackTab.style.display = 'flex';
        reportTab.style.display = 'flex';
    } else {
        // 평가 관련 탭들 숨기기
        evaluationTab.style.display = 'none';
        feedbackTab.style.display = 'none';
        reportTab.style.display = 'none';
    }
    
    // 결과 섹션 표시
    resultsSection.style.display = 'block';
    
    // 첫 번째 탭(루브릭)을 활성화
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('active'));
    
    document.querySelector('[data-tab="rubric"]').classList.add('active');
    document.getElementById('rubric').classList.add('active');
}

// 샘플 데이터 로드 기능
function loadSampleData() {
    document.getElementById('topic').value = '지구 문제에 우리는 어떻게 대처하는가?(환경문제)';
    document.getElementById('objective').value = '환경 논제 글쓰기';
    document.getElementById('grade_level').value = '6';
    document.getElementById('name').value = '이종복';
    document.getElementById('student_submission').value = `요즘 뉴스나 학교에서 환경문제에 대해 많이 배우고 있습니다. 지구에는 여러 가지 문제가 생기고 있는데, 그 중에서도 지구 온난화, 쓰레기 문제, 공기 오염이 심각합니다. 이런 문제를 그냥 두면, 우리가 살기 힘든 지구가 될 수 있습니다. 그래서 우리는 작은 일부터 실천해야 합니다. 예를 들어, 분리수거를 잘하기, 물을 아껴 쓰기, 전기를 아껴 쓰기, 일회용품을 덜 쓰기 같은 일이 있습니다. 우리 가족은 장을 볼 때 에코백을 가져가고, 집에서는 텀블러를 사용합니다. 또 저는 친구들과 함께 학교에서 쓰레기 줍기 활동에도 참여했습니다. 이런 작은 실천들이 모이면 지구를 살리는 데 도움이 된다고 생각합니다. 지구는 우리 모두가 함께 살아가는 소중한 집입니다. 앞으로도 환경을 생각하며 행동하는 사람이 되고 싶습니다.`;
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    form.addEventListener('submit', handleFormSubmit);
    
    // 입력 필드 변경 시 버튼 텍스트 업데이트
    nameInput.addEventListener('input', updateSubmitButton);
    submissionInput.addEventListener('input', updateSubmitButton);
    
    // 내보내기 버튼 이벤트 리스너
    exportSheetsBtn.addEventListener('click', exportToGoogleSheets);
    
    // 초기 버튼 텍스트 설정
    updateSubmitButton();
    
    // 개발용 샘플 데이터 로드 버튼 추가 (콘솔에서 호출 가능)
    window.loadSampleData = loadSampleData;
    
    console.log('루브릭 에이전트 프론트엔드가 준비되었습니다!');
    console.log('개발용 샘플 데이터를 로드하려면 콘솔에서 loadSampleData()를 실행하세요.');
});

// 에러 처리를 위한 전역 에러 핸들러
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showError('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.');
});

// 네트워크 상태 확인
window.addEventListener('online', () => {
    console.log('네트워크 연결이 복원되었습니다.');
});

window.addEventListener('offline', () => {
    showError('네트워크 연결이 끊어졌습니다. 인터넷 연결을 확인해주세요.');
});
