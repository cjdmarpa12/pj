//예시 데이터
let students = JSON.parse(localStorage.getItem('studentData')) || [
    { id: "20230775", name: "김태성", score: 95, grade: "A", major: "컴퓨터공학과", attendance: {} }
];

// 현재 출석 테이블에 표시할 기준 날짜 (기본값: 오늘 날짜 YYYY-MM-DD 형식)
let selectedDate = new Date().toISOString().split('T')[0];

// ─────────────────────────────────────────────
//학과명 자동완성 기능
// ─────────────────────────────────────────────
const majorAliases = {
    '컴공': '컴퓨터공학과',
    '게임': '게임학과',
    '컴공과': '컴퓨터공학과'
};

// 입력된 학과명이 약어이면 정식 이름으로 변환, 아니면 그대로 반환한다.
function normalizeMajor(input) {
    return majorAliases[input.trim()] || input.trim();
}

// ─────────────────────────────────────────────
// 점수 → 등급 변환 함수
// 90점 이상 A, 80점 이상 B, 70점 이상 C, 60점 이상 D, 미만 F
// ─────────────────────────────────────────────
function calculateGrade(score) {
    const num = parseInt(score) || 0;
    if (num >= 90) return 'A';
    if (num >= 80) return 'B';
    if (num >= 70) return 'C';
    if (num >= 60) return 'D';
    return 'F';
}

function renderTable(data = students) {
    const tbody = document.querySelector('.student-box tbody');
    tbody.innerHTML = "";

    // 학생이 한 명도 없으면 안내 메시지를 표시하고 종료한다.
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="color: #999; padding: 30px;">등록된 학생이 없습니다.</td></tr>`;
        return;
    }

    data.forEach((student) => {
        if (!student.attendance) student.attendance = {};

        const currentStatus = student.attendance[selectedDate] || "출석";

        const row = document.createElement('tr');

   
        row.onclick = () => showAttendanceModal(student.id);

        row.innerHTML = `
            <td class="student_num">${student.id}</td>
            <td class="name">${student.name}</td>

            <!-- 성적 드롭다운: 클릭이 행 이벤트로 전파되지 않도록 stopPropagation 처리 -->
            <td onclick="event.stopPropagation()">
                <select class="score" onchange="updateGrade('${student.id}', this.value)">
                    <option value="A" ${student.grade === 'A' ? 'selected' : ''}>A</option>
                    <option value="B" ${student.grade === 'B' ? 'selected' : ''}>B</option>
                    <option value="C" ${student.grade === 'C' ? 'selected' : ''}>C</option>
                    <option value="D" ${student.grade === 'D' ? 'selected' : ''}>D</option>
                    <option value="F" ${student.grade === 'F' ? 'selected' : ''}>F</option>
                </select>
            </td>
            <td class="major">${student.major}</td>

            <!-- 출석 드롭다운: 선택된 날짜의 출석 상태를 변경한다 -->
            <td onclick="event.stopPropagation()">
                <select class="attendance" onchange="updateAttendance('${student.id}', this.value)">
                    <option value="출석" ${currentStatus === '출석' ? 'selected' : ''}>출석</option>
                    <option value="지각" ${currentStatus === '지각' ? 'selected' : ''}>지각</option>
                    <option value="결석" ${currentStatus === '결석' ? 'selected' : ''}>결석</option>
                </select>
            </td>

            <!-- 삭제 버튼: 해당 학생을 목록에서 제거한다 -->
            <td onclick="event.stopPropagation()">
                <button type="button" class="bt-del" onclick="deleteStudent('${student.id}')">삭제</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function saveToLocalStorage() {
    localStorage.setItem('studentData', JSON.stringify(students));
}

// ─────────────────────────────────────────────
// 학생 추가 함수
// 입력창 4개(학번, 이름, 성적, 학과)의 값 입력 시 학생정보 추가
// 배열에 추가한 뒤 테이블을 다시 렌더링한다.
// ─────────────────────────────────────────────
function addStudent() {
    const inputs = document.querySelectorAll('.student-add input');
    const idInput = inputs[0];
    const nameInput = inputs[1];
    const scoreInput = inputs[2];
    const majorInput = inputs[3];

    // 입력값 중 하나라도 비어있으면 경고 후 종료
    if (!idInput.value || !nameInput.value || !scoreInput.value || !majorInput.value) {
        alert("모든 빈칸을 입력해주세요!");
        return;
    }

    // 동일한 학번이 이미 존재하면 중복 등록방지
    if (students.some(s => s.id === idInput.value)) {
        alert("이미 존재하는 학번입니다.");
        return;
    }

    // 점수를 기반으로 등급을 자동 계산
    const calculatedGrade = calculateGrade(scoreInput.value);

    students.push({
        id: idInput.value,
        name: nameInput.value,
        score: parseInt(scoreInput.value) || 0,
        grade: calculatedGrade,
        major: normalizeMajor(majorInput.value), //학과명 자동완성
        attendance: {} // 날짜별 출석 기록을 위해 빈 객체로 초기화
    });

    saveToLocalStorage();
    renderTable();

    // 추가 완료 후 입력창을 모두 초기화
    idInput.value = "";
    nameInput.value = "";
    scoreInput.value = "";
    majorInput.value = "";
}

// ─────────────────────────────────────────────
// 학생 삭제 함수
// 확인 대화상자 후 해당 학번의 학생을 배열에서 제거한다.
// ─────────────────────────────────────────────
function deleteStudent(id) {
    if (confirm("정말 이 학생을 삭제하시겠습니까?")) {
        students = students.filter(student => student.id !== id);
        saveToLocalStorage();
        renderTable();
    }
}

// ─────────────────────────────────────────────
// 성적 수동 변경 함수
// ─────────────────────────────────────────────
function updateGrade(id, newGrade) {
    const student = students.find(s => s.id === id);
    if (student) {
        student.grade = newGrade;

        // 등급에 맞는 대표 점수를 할당한다.
        if (newGrade === 'A') student.score = 95;
        else if (newGrade === 'B') student.score = 85;
        else if (newGrade === 'C') student.score = 75;
        else if (newGrade === 'D') student.score = 65;
        else if (newGrade === 'F') student.score = 50;

        saveToLocalStorage();
    }
}

// ─────────────────────────────────────────────
// 출석 상태 변경 함수
// 선택된 날짜에 해당 학생의 출석 상태를 저장
// 결석이 누적 4회 이상이면 성적을 자동으로 F 처리
// 4회 미만으로 줄어들면 점수 기반 등급으로 복구
// ─────────────────────────────────────────────
function updateAttendance(id, newStatus) {
    const student = students.find(s => s.id === id);
    if (student) {
        if (!student.attendance) student.attendance = {};

        // 현재 날짜에 출석 상태 기록
        student.attendance[selectedDate] = newStatus;

        // 전체 날짜 중 결석 횟수를 계산
        const absenceCount = Object.values(student.attendance).filter(v => v === '결석').length;

        // 결석 4회 이상이면 성적 강제 F, 미만이면 점수 기반 등급 복구
        if (absenceCount >= 4) {
            student.grade = 'F';
        } else {
            student.grade = calculateGrade(student.score);
        }

        saveToLocalStorage();
        renderTable();
        console.log(`${selectedDate} 변경사항 -> ${student.name} : ${newStatus}`);
    }
}

// ─────────────────────────────────────────────
// 학생 검색 함수
// ─────────────────────────────────────────────
function filterStudents() {
    const query = document.querySelector('.search input[type="text"]').value.toLowerCase();
    const filtered = students.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.id.includes(query)
    );
    renderTable(filtered);
}

// ─────────────────────────────────────────────
// 학생 정렬 함수
// 정렬 기준(학번 오름차순 / 이름 가나다순 / 성적 높은순)에 따라
// 배열을 정렬, 현재 검색어가 있으면 필터도 함께 적용
// ─────────────────────────────────────────────
function sortStudents() {
    const sortType = document.querySelector('.search select').value;
    let sorted = [...students];

    if (sortType === "idAsc") {
        sorted.sort((a, b) => a.id.localeCompare(b.id));       // 학번 오름차순
    } else if (sortType === "nameAsc") {
        sorted.sort((a, b) => a.name.localeCompare(b.name));   // 이름 가나다순
    } else if (sortType === "scoreDesc") {
        sorted.sort((a, b) => b.score - a.score);              // 성적 높은순
    }

    // 검색어가 있으면 정렬 후 추가로 필터링한다.
    const query = document.querySelector('.search input[type="text"]').value.toLowerCase();
    if (query) {
        sorted = sorted.filter(student =>
            student.name.toLowerCase().includes(query) ||
            student.id.includes(query)
        );
    }
    renderTable(sorted);
}

// ─────────────────────────────────────────────
// 출결 현황 팝업창 함수(모달)
// ─────────────────────────────────────────────
function showAttendanceModal(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    const records = student.attendance || {};

    // 날짜 목록을 오름차순으로 정렬
    const dates = Object.keys(records).sort();

    // 출석/지각/결석 각각의 총 횟수를 집계
    const 출석수 = dates.filter(d => records[d] === '출석').length;
    const 지각수 = dates.filter(d => records[d] === '지각').length;
    const 결석수 = dates.filter(d => records[d] === '결석').length;

    // 모달 제목에 학생 이름과 학번을 표시
    document.getElementById('modal-title').textContent = `${student.name} (${student.id}) 출석 현황`;

    // 출석/지각/결석 횟수 요약 칩을 렌더링
    document.getElementById('modal-summary').innerHTML = `
        <span class="summary-chip chip-출석">출석 ${출석수}회</span>
        <span class="summary-chip chip-지각">지각 ${지각수}회</span>
        <span class="summary-chip chip-결석">결석 ${결석수}회</span>
    `;

    const body = document.getElementById('modal-body');

    // 기록이 없으면 안내 메시지를, 있으면 날짜별 상태 목록을 렌더링
    if (dates.length === 0) {
        body.innerHTML = `<div class="modal-empty">기록된 출석 정보가 없습니다.</div>`;
    } else {
        body.innerHTML = dates.map(date => `
            <div class="attendance-record">
                <span class="record-date">${date}</span>
                <span class="record-status status-${records[date]}">${records[date]}</span>
            </div>
        `).join('');
    }

    // 모달을 화면에 표시
    document.getElementById('attendance-modal').classList.add('open');
}

// 출결팝업창 닫기 함수
function closeModal() {
    document.getElementById('attendance-modal').classList.remove('open');
}


window.onload = function() {
    const datePicker = document.getElementById('current-date');

    // 날짜 선택 범위를 3월 2일 ~ 6월 22일로 제한한다.
    const year = new Date().getFullYear();
    datePicker.min = `${year}-03-02`;
    datePicker.max = `${year}-06-22`;

    // 오늘 날짜가 범위를 벗어나면 시작일로 초기값을 맞춘다.
    if (selectedDate < datePicker.min) selectedDate = datePicker.min;
    if (selectedDate > datePicker.max) selectedDate = datePicker.max;
    datePicker.value = selectedDate;

    datePicker.addEventListener('change', function(e) {
        selectedDate = e.target.value;
        renderTable();
    });

    renderTable();
    document.querySelector('.student-add button').addEventListener('click', addStudent);
    document.querySelector('.search input[type="text"]').addEventListener('keyup', filterStudents);
    document.querySelector('.search select').addEventListener('change', sortStudents);
};
